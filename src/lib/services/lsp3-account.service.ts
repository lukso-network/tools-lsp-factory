import { ERC725 } from '@erc725/erc725.js';
import { TransactionReceipt } from '@ethersproject/providers';
import axios from 'axios';
import { BytesLike, Contract, ContractFactory, ethers, Signer } from 'ethers';
import { concat, defer, EMPTY, forkJoin, from, Observable, of } from 'rxjs';
import { defaultIfEmpty, shareReplay, switchMap } from 'rxjs/operators';

import {
  LSP3UniversalProfile,
  UniversalProfile__factory,
  UniversalProfileInit__factory,
} from '../..';
import {
  ADDRESS_PERMISSIONS_ARRAY_KEY,
  DEFAULT_PERMISSIONS,
  GAS_BUFFER,
  GAS_PRICE,
  LSP3_UP_KEYS,
  PREFIX_PERMISSIONS,
} from '../helpers/config.helper';
import {
  deployContract,
  getProxyByteCode,
  initialize,
  waitForReceipt,
} from '../helpers/deployment.helper';
import { encodeLSP3Profile } from '../helpers/erc725.helper';
import { isMetadataEncoded } from '../helpers/uploader.helper';
import {
  BaseContractAddresses,
  ContractNames,
  ControllerOptions,
  DeploymentEvent$,
  DeploymentEventContract,
  DeploymentEventProxyContract,
  DeploymentEventTransaction,
  DeploymentStatus,
  DeploymentType,
  LSP3ProfileJSON,
  ProfileDataBeforeUpload,
} from '../interfaces';
import { LSP3ProfileDataForEncoding } from '../interfaces/lsp3-profile';
import { UploadOptions } from '../interfaces/profile-upload-options';

import { UniversalReveiverDeploymentEvent } from './universal-receiver.service';

export type LSP3AccountDeploymentEvent = DeploymentEventContract | DeploymentEventProxyContract;

export function accountDeployment$(
  signer: Signer,
  baseContractAddresses$: Observable<BaseContractAddresses>,
  bytecode?: string
) {
  return baseContractAddresses$.pipe(
    switchMap((baseContractAddresses) => {
      return accountDeploymentWithBaseContractAddress$(
        signer,
        baseContractAddresses.ERC725Account,
        bytecode
      );
    }),
    shareReplay()
  );
}

export function accountDeploymentWithBaseContractAddress$(
  signer: Signer,
  baseContractAddress: string,
  bytecode?: string
): Observable<LSP3AccountDeploymentEvent> {
  const accountDeployment$ = defer(() =>
    deployLSP3Account(signer, baseContractAddress, bytecode)
  ).pipe(shareReplay());

  const accountDeploymentReceipt$ = waitForReceipt<LSP3AccountDeploymentEvent>(
    accountDeployment$
  ).pipe(shareReplay());

  const accountDeploymentInitialize$ = baseContractAddress
    ? initializeProxy(signer, accountDeploymentReceipt$ as Observable<DeploymentEventProxyContract>)
    : EMPTY;

  const accountDeploymentInitializeReceipt$ = waitForReceipt<LSP3AccountDeploymentEvent>(
    accountDeploymentInitialize$
  ).pipe(shareReplay());

  return concat(
    accountDeployment$,
    accountDeploymentReceipt$,
    accountDeploymentInitialize$,
    accountDeploymentInitializeReceipt$
  );
}

async function deployLSP3Account(
  signer: Signer,
  baseContractAddress: string,
  byteCode?: string
): Promise<LSP3AccountDeploymentEvent> {
  const deploymentFunction = async () => {
    if (baseContractAddress) {
      return new UniversalProfileInit__factory(signer).attach(baseContractAddress);
    }

    if (byteCode) {
      return new ContractFactory(UniversalProfile__factory.abi, byteCode, signer).deploy(
        await signer.getAddress()
      );
    }

    return await new UniversalProfile__factory(signer).deploy(await signer.getAddress());
  };

  return baseContractAddress
    ? deployProxyContract(deploymentFunction, signer)
    : deployContract(deploymentFunction, ContractNames.ERC725_Account);
}

export async function deployProxyContract(
  deployContractFunction,
  signer: Signer
): Promise<DeploymentEventProxyContract> {
  try {
    const contract: Contract = await deployContractFunction();
    const factory = new ContractFactory(
      UniversalProfile__factory.abi,
      getProxyByteCode(contract.address),
      signer
    );
    const deployedProxy = await factory.deploy(signer.getAddress());
    const transaction = deployedProxy.deployTransaction;
    return {
      type: DeploymentType.PROXY,
      contractName: ContractNames.ERC725_Account,
      status: DeploymentStatus.PENDING,
      transaction,
    };
  } catch (error) {
    console.error(`Error when deploying ${ContractNames.ERC725_Account}`, error);
    throw error;
  }
}

function initializeProxy(
  signer: Signer,
  accountDeploymentReceipt$: Observable<DeploymentEventProxyContract>
) {
  return initialize(
    accountDeploymentReceipt$,
    new UniversalProfileInit__factory(signer),
    async () => {
      const signerAddress = await signer.getAddress();
      return [signerAddress];
    }
  ).pipe(shareReplay());
}

export function setDataTransaction$(
  signer: Signer,
  account$: Observable<LSP3AccountDeploymentEvent>,
  universalReceiver$: Observable<UniversalReveiverDeploymentEvent>,
  controllerAddresses: (string | ControllerOptions)[],
  lsp3ProfileData$: Observable<LSP3ProfileDataForEncoding | string | null>,
  isSignerUniversalProfile$: Observable<boolean>,
  defaultUniversalReceiverDelegateAddress?: string
) {
  const universalReceiverAddress$ = universalReceiver$.pipe(
    defaultIfEmpty({ receipt: null }),
    shareReplay()
  );

  const setDataTransaction$ = forkJoin([
    account$,
    universalReceiverAddress$,
    lsp3ProfileData$,
    isSignerUniversalProfile$,
  ]).pipe(
    switchMap(
      ([
        { receipt: lsp3AccountReceipt },
        { receipt: universalReceiverDelegateReceipt },
        lsp3ProfileData,
        isSignerUniversalProfile,
      ]) => {
        const lsp3AccountAddress = isSignerUniversalProfile
          ? lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.logs[0].address
          : lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.to;

        const universalReceiverDelegateAddress = isSignerUniversalProfile
          ? universalReceiverDelegateReceipt?.contractAddress ||
            universalReceiverDelegateReceipt?.logs[0]?.topics[2]?.slice(26) ||
            defaultUniversalReceiverDelegateAddress
          : universalReceiverDelegateReceipt?.contractAddress ||
            universalReceiverDelegateReceipt?.to ||
            defaultUniversalReceiverDelegateAddress;

        return setData(
          signer,
          lsp3AccountAddress,
          universalReceiverDelegateAddress,
          controllerAddresses,
          lsp3ProfileData
        );
      }
    ),
    shareReplay()
  );

  const setDataReceipt$ = waitForReceipt<DeploymentEventTransaction>(setDataTransaction$);
  return concat(setDataTransaction$, setDataReceipt$);
}

export async function getLsp3ProfileDataUrl(
  lsp3Profile: ProfileDataBeforeUpload | string,
  uploadOptions?: UploadOptions
): Promise<LSP3ProfileDataForEncoding> {
  let lsp3ProfileData: LSP3ProfileDataForEncoding;

  if (typeof lsp3Profile === 'string') {
    let lsp3JsonUrl = lsp3Profile;
    const isIPFSUrl = lsp3Profile.startsWith('ipfs://');

    if (isIPFSUrl) {
      // TODO: Handle simple HTTP upload
      const protocol = uploadOptions.ipfsClientOptions.host ?? 'https';
      const host = uploadOptions.ipfsClientOptions.host ?? 'ipfs.lukso.network';

      lsp3JsonUrl = `${[protocol]}://${host}/ipfs/${lsp3Profile.split('/').at(-1)}`;
    }

    const ipfsResponse = await axios.get(lsp3JsonUrl);
    const lsp3ProfileJson = ipfsResponse.data;

    lsp3ProfileData = {
      url: lsp3Profile,
      profile: lsp3ProfileJson as LSP3ProfileJSON,
    };
  } else {
    lsp3ProfileData = await LSP3UniversalProfile.uploadProfileData(lsp3Profile, uploadOptions);
  }

  return lsp3ProfileData;
}

export function lsp3ProfileUpload$(
  lsp3Profile: ProfileDataBeforeUpload | string,
  uploadOptions?: UploadOptions
) {
  let lsp3Profile$: Observable<LSP3ProfileDataForEncoding | string>;

  if (typeof lsp3Profile !== 'string' || !isMetadataEncoded(lsp3Profile)) {
    lsp3Profile$ = lsp3Profile
      ? from(getLsp3ProfileDataUrl(lsp3Profile, uploadOptions)).pipe(shareReplay())
      : of(null);
  } else {
    lsp3Profile$ = of(lsp3Profile);
  }

  return lsp3Profile$;
}

/**
 * Encodes and sets LSP3 Profile data on the UniversalProfile with
 * Permissions for Universal Receiver Delegate and controller keys
 *
 * @param {Signer} signer
 * @param {string} erc725AccountAddress
 * @param {string} universalReceiverDelegateAddress
 * @param {(string | ControllerOptions)[]} controllerAddresses
 * @param {LSP3ProfileDataForEncoding | string} lsp3Profile
 *
 * @return {*}  Observable<LSP3AccountDeploymentEvent | DeploymentEventTransaction>
 */
export async function setData(
  signer: Signer,
  erc725AccountAddress: string,
  universalReceiverDelegateAddress: string,
  controllerAddresses: (string | ControllerOptions)[],
  lsp3Profile?: LSP3ProfileDataForEncoding | string
): Promise<DeploymentEventTransaction> {
  // TODO: move this to profile upload logic
  let encodedLSP3Profile;
  if (lsp3Profile && typeof lsp3Profile !== 'string') {
    const encodedDataResult = lsp3Profile
      ? encodeLSP3Profile(lsp3Profile.profile, lsp3Profile.url)
      : null;

    encodedLSP3Profile = encodedDataResult.LSP3Profile.value;
  } else {
    encodedLSP3Profile = lsp3Profile;
  }

  const erc725Account = new UniversalProfile__factory(signer).attach(erc725AccountAddress);

  const signersAddresses: string[] = [];
  const signersPermissions: string[] = [];

  controllerAddresses.map((controller, index) => {
    if (typeof controller === 'string') {
      signersAddresses[index] = controller;
      signersPermissions[index] = ERC725.encodePermissions(DEFAULT_PERMISSIONS);
    } else {
      signersAddresses[index] = controller.address;
      signersPermissions[index] = controller.permissions;
    }
  });

  // see: https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-6-KeyManager.md#addresspermissionspermissionsaddress
  const addressPermissionsKeys = signersAddresses.map(
    (address) => PREFIX_PERMISSIONS + address.substring(2)
  );

  // see: https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-6-KeyManager.md#addresspermissions
  const addressPermissionsArrayElements = signersAddresses.map((_, index) => {
    const hexIndex = ethers.utils.hexlify([index]);

    const leftSide = ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34);
    const rightSide = ethers.utils.hexZeroPad(hexIndex, 16);

    return leftSide + rightSide.substring(2);
  });

  const hexIndex = ethers.utils.hexlify([signersAddresses.length]);

  const universalReceiverPermissionIndex =
    ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) + ethers.utils.hexZeroPad(hexIndex, 16).substring(2);

  const keysToSet = [
    LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY,
    ...addressPermissionsKeys, // AddressPermissions:Permissions:<controllerAddress> = controllerPermission,
    PREFIX_PERMISSIONS + universalReceiverDelegateAddress.substring(2),
    ADDRESS_PERMISSIONS_ARRAY_KEY,
    ...addressPermissionsArrayElements, // AddressPermission[index] = controllerAddress
    universalReceiverPermissionIndex,
  ];

  const SET_DATA_PERMISSION = ERC725.encodePermissions({
    SETDATA: true,
  });

  const valuesToSet = [
    universalReceiverDelegateAddress,
    ...signersPermissions,
    SET_DATA_PERMISSION,
    ethers.utils.defaultAbiCoder.encode(['uint256'], [signersPermissions.length]),
    ...signersAddresses,
    universalReceiverDelegateAddress,
  ];

  if (encodedLSP3Profile) {
    keysToSet.push(LSP3_UP_KEYS.LSP3_PROFILE);
    valuesToSet.push(encodedLSP3Profile);
  }

  const gasEstimate = await erc725Account.estimateGas.setData(
    keysToSet,
    valuesToSet as BytesLike[],
    {
      gasPrice: GAS_PRICE,
    }
  );

  const transaction = await erc725Account.setData(keysToSet, valuesToSet as BytesLike[], {
    gasLimit: gasEstimate.add(GAS_BUFFER),
    gasPrice: GAS_PRICE,
  });

  return {
    type: DeploymentType.TRANSACTION,
    contractName: ContractNames.ERC725_Account,
    functionName: 'setData',
    status: DeploymentStatus.PENDING,
    transaction,
  };
}

export function getTransferOwnershipTransaction$(
  signer: Signer,
  accountDeployment$: DeploymentEvent$,
  keyManagerDeployment$: DeploymentEvent$,
  isSignerUniversalProfile$: Observable<boolean>
) {
  const transferOwnershipTransaction$ = forkJoin([
    accountDeployment$,
    keyManagerDeployment$,
    isSignerUniversalProfile$,
  ]).pipe(
    switchMap(
      ([
        { receipt: lsp3AccountReceipt },
        { receipt: keyManagerContract },
        isSignerUniversalProfile,
      ]) => {
        return transferOwnership(
          signer,
          lsp3AccountReceipt,
          keyManagerContract,
          isSignerUniversalProfile
        );
      }
    ),
    shareReplay()
  );
  const transferOwnershipReceipt$ = waitForReceipt<DeploymentEventTransaction>(
    transferOwnershipTransaction$
  );
  return concat(transferOwnershipTransaction$, transferOwnershipReceipt$);
}

/**
 * Transfers ownership of the KeyManager contract to the
 * Permissions for Universal Receiver Delegate and controller keys
 *
 * @param {Signer} signer
 * @param {string} erc725AccountAddress
 * @param {string} universalReceiverDelegateAddress
 * @param {(string | ControllerOptions)[]} controllerAddresses
 * @param {LSP3ProfileDataForEncoding | string} lsp3Profile
 *
 * @return {*}  Observable<LSP3AccountDeploymentEvent | DeploymentEventTransaction>
 */
export async function transferOwnership(
  signer: Signer,
  lsp3AccountReceipt: TransactionReceipt,
  keyManagerReceipt: TransactionReceipt,
  isSignerUniversalProfile: boolean
): Promise<DeploymentEventTransaction> {
  try {
    const signerAddress = await signer.getAddress();

    const lsp3Address = isSignerUniversalProfile
      ? lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.logs[0].address
      : lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.to;

    const keyManagerAddress = isSignerUniversalProfile
      ? keyManagerReceipt.contractAddress || '0x' + keyManagerReceipt.logs[0].topics[2].slice(26)
      : keyManagerReceipt.contractAddress || keyManagerReceipt.to;

    const contract = new UniversalProfile__factory(signer).attach(lsp3Address);

    const gasEstimate = await contract.estimateGas.transferOwnership(keyManagerAddress, {
      from: signerAddress,
      gasPrice: GAS_PRICE,
    });

    const transaction = await contract.transferOwnership(keyManagerAddress, {
      from: signerAddress,
      gasLimit: gasEstimate.add(GAS_BUFFER),
      gasPrice: GAS_PRICE,
    });

    return {
      type: DeploymentType.TRANSACTION,
      status: DeploymentStatus.PENDING,
      contractName: ContractNames.ERC725_Account,
      functionName: 'transferOwnership',
      transaction,
    };
  } catch (error) {
    console.error('Error when transferring Ownership', error);
    throw error;
  }
}

export function isSignerUniversalProfile$(signer: Signer) {
  return defer(async () => {
    try {
      const signerAddress = await signer.getAddress();
      const universalProfile = UniversalProfile__factory.connect(signerAddress, signer);

      const owner = await universalProfile.owner();
      return !!owner;
    } catch (error) {
      return false;
    }

    return false;
  }).pipe(shareReplay());
}
