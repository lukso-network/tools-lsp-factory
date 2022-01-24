import { TransactionReceipt } from '@ethersproject/providers';
import axios from 'axios';
import { BytesLike, Contract, ContractFactory, ethers, Signer } from 'ethers';
import { concat, defer, EMPTY, forkJoin, from, Observable, of } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import {
  LSP3UniversalProfile,
  UniversalProfile__factory,
  UniversalProfileInit__factory,
} from '../..';
import {
  ADDRESS_PERMISSIONS_ARRAY_KEY,
  ALL_PERMISSIONS,
  GAS_BUFFER,
  GAS_PRICE,
  LSP3_UP_KEYS,
  PREFIX_PERMISSIONS,
  SET_DATA_PERMISSION,
} from '../helpers/config.helper';
import {
  deployContract,
  getProxyByteCode,
  initialize,
  waitForReceipt,
} from '../helpers/deployment.helper';
import { encodeLSP3Profile } from '../helpers/erc725.helper';
import {
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

import { UniversalReveiverDeploymentEvent } from './universal-receiver.service';

export type LSP3AccountDeploymentEvent = DeploymentEventContract | DeploymentEventProxyContract;

export function accountDeployment$(
  signer: Signer,
  controllerAddresses: string[],
  baseContractAddresses$: Observable<{
    [ContractNames.ERC725_Account]: string;
    [ContractNames.UNIVERSAL_RECEIVER]: string;
  }>
) {
  return baseContractAddresses$.pipe(
    switchMap((baseContractAddresses) => {
      return accountDeploymentWithBaseContractAddress$(
        signer,
        controllerAddresses,
        baseContractAddresses.ERC725Account
      );
    }),
    shareReplay()
  );
}

export function accountDeploymentWithBaseContractAddress$(
  signer: Signer,
  controllerAddresses: string[],
  baseContractAddress: string
): Observable<LSP3AccountDeploymentEvent> {
  const accountDeployment$ = defer(() =>
    deployLSP3Account(signer, controllerAddresses, baseContractAddress)
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
  ownerAddresses: string[],
  baseContractAddress: string
): Promise<LSP3AccountDeploymentEvent> {
  const deploymentFunction = async () => {
    return baseContractAddress
      ? new UniversalProfileInit__factory(signer).attach(baseContractAddress)
      : await new UniversalProfile__factory(signer).deploy(ownerAddresses[0]);
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
  lsp3ProfileData$: Observable<LSP3ProfileDataForEncoding | string | null>
) {
  const setDataTransaction$ = forkJoin([account$, universalReceiver$, lsp3ProfileData$]).pipe(
    switchMap(
      ([
        { receipt: lsp3AccountReceipt },
        { receipt: universalReceiverDelegateReceipt },
        lsp3ProfileData,
      ]) => {
        return setData(
          signer,
          lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.to,
          universalReceiverDelegateReceipt.contractAddress || universalReceiverDelegateReceipt.to,
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
  lsp3Profile: ProfileDataBeforeUpload | string
): Promise<LSP3ProfileDataForEncoding> {
  let lsp3ProfileData: {
    profile: LSP3ProfileJSON;
    url: string;
  };

  if (typeof lsp3Profile === 'string') {
    let lsp3JsonUrl = lsp3Profile;
    const isIPFSUrl = lsp3Profile.startsWith('ipfs://');

    if (isIPFSUrl) {
      lsp3JsonUrl = 'https://ipfs.lukso.network/ipfs/' + lsp3Profile.split('/').at(-1); // TODO: Allow custom IPFS upload location
    }

    const ipfsResponse = await axios.get(lsp3JsonUrl);
    const lsp3ProfileJson = ipfsResponse.data;

    lsp3ProfileData = {
      url: lsp3Profile,
      profile: lsp3ProfileJson as LSP3ProfileJSON,
    };
  } else {
    lsp3ProfileData = await LSP3UniversalProfile.uploadProfileData(lsp3Profile);
  }

  return lsp3ProfileData;
}

export function isLSP3ProfileDataEncoded(lsp3Profile: string): boolean {
  if (!lsp3Profile.startsWith('ipfs://') && !lsp3Profile.startsWith('https://')) {
    return true;
  }

  return false;
}

export function lsp3ProfileUpload$(lsp3Profile: ProfileDataBeforeUpload | string) {
  let lsp3Profile$: Observable<LSP3ProfileDataForEncoding | string>;

  if (typeof lsp3Profile !== 'string' || !isLSP3ProfileDataEncoded(lsp3Profile)) {
    lsp3Profile$ = lsp3Profile ? from(getLsp3ProfileDataUrl(lsp3Profile)) : of(null);
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
  const abiCoder = ethers.utils.defaultAbiCoder;

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

  let signersAddresses: string[];
  let signersPermissions: string[];

  controllerAddresses.map((controller, index) => {
    if (typeof controller === 'string') {
      signersAddresses[index] = controller;
      signersPermissions[index] = ALL_PERMISSIONS;
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
  const addressPermissionsArrayElements = signersAddresses.map(
    (_, index) =>
      ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) +
      abiCoder.encode(['uint128'], [index]).substring(2)
  );

  const keysToSet = [
    LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY,
    ...addressPermissionsKeys, // AddressPermissions:Permissions:<controllerAddress> = controllerPermission,
    PREFIX_PERMISSIONS + universalReceiverDelegateAddress.substring(2),
    ADDRESS_PERMISSIONS_ARRAY_KEY,
    ...addressPermissionsArrayElements, // AddressPermission[index] = controllerAddress
    ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) +
      abiCoder.encode(['uint128'], [signersAddresses.length + 1]).substring(2),
  ];

  const valuesToSet = [
    universalReceiverDelegateAddress,
    ...signersPermissions,
    SET_DATA_PERMISSION,
    abiCoder.encode(['uint256'], [signersPermissions.length]),
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
  keyManagerDeployment$: DeploymentEvent$
) {
  const transferOwnershipTransaction$ = forkJoin([accountDeployment$, keyManagerDeployment$]).pipe(
    switchMap(([{ receipt: lsp3AccountReceipt }, { receipt: keyManagerContract }]) => {
      return transferOwnership(signer, lsp3AccountReceipt, keyManagerContract);
    }),
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
  keyManagerReceipt: TransactionReceipt
): Promise<DeploymentEventTransaction> {
  try {
    const signerAddress = await signer.getAddress();
    const contract = new UniversalProfile__factory(signer).attach(
      lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.to
    );

    const gasEstimate = await contract.estimateGas.transferOwnership(
      keyManagerReceipt.contractAddress || keyManagerReceipt.to,
      {
        from: signerAddress,
        gasPrice: GAS_PRICE,
      }
    );

    const transaction = await contract.transferOwnership(
      keyManagerReceipt.contractAddress || keyManagerReceipt.to,
      {
        from: signerAddress,
        gasLimit: gasEstimate.add(GAS_BUFFER),
        gasPrice: GAS_PRICE,
      }
    );

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
