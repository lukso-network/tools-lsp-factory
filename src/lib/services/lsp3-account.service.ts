import { ERC725 } from '@erc725/erc725.js';
import axios from 'axios';
import { BytesLike, Contract, ContractFactory, ethers, Signer } from 'ethers';
import { concat, defer, EMPTY, forkJoin, from, Observable, of } from 'rxjs';
import { defaultIfEmpty, mergeMap, shareReplay, switchMap } from 'rxjs/operators';

import { UniversalProfile, UniversalProfile__factory, UniversalProfileInit__factory } from '../..';
import {
  ADDRESS_PERMISSIONS_ARRAY_KEY,
  DEFAULT_PERMISSIONS,
  GAS_BUFFER,
  GAS_PRICE,
  LSP3_UP_KEYS,
  PREFIX_PERMISSIONS,
} from '../helpers/config.helper';
import {
  convertContractDeploymentOptionsVersion,
  deployContract,
  getProxyByteCode,
  initialize,
  waitForReceipt,
} from '../helpers/deployment.helper';
import { erc725EncodeData } from '../helpers/erc725.helper';
import { formatIPFSUrl, isMetadataEncoded } from '../helpers/uploader.helper';
import {
  BaseContractAddresses,
  ContractDeploymentOptions,
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
  UniversalProfileDeploymentConfiguration,
} from '../interfaces';
import { LSP3ProfileDataForEncoding, ProfileDataForEncoding } from '../interfaces/lsp3-profile';
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
        baseContractAddresses.LSP0ERC725Account,
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
    },
    'initialize(address)'
  ).pipe(shareReplay());
}

export function setDataAndTransferOwnershipTransactions$(
  signer: Signer,
  account$: Observable<LSP3AccountDeploymentEvent>,
  universalReceiver$: Observable<UniversalReveiverDeploymentEvent>,
  controllerAddresses: (string | ControllerOptions)[],
  lsp3ProfileData$: Observable<string | null>,
  isSignerUniversalProfile$: Observable<boolean>,
  keyManagerDeployment$: DeploymentEvent$,
  defaultUniversalReceiverDelegateAddress?: string
): Observable<DeploymentEventTransaction> {
  const setDataParameters$ = prepareSetDataTransaction$(
    account$,
    universalReceiver$,
    controllerAddresses,
    lsp3ProfileData$,
    isSignerUniversalProfile$,
    defaultUniversalReceiverDelegateAddress
  );

  const transferOwnershipParameters$ = prepareTransferOwnershipTransaction$(
    account$,
    keyManagerDeployment$,
    isSignerUniversalProfile$
  );

  const pendingTransactionArray$ = forkJoin([
    setDataParameters$,
    transferOwnershipParameters$,
  ]).pipe(
    switchMap(([{ erc725AccountAddress, keysToSet, valuesToSet }, { keyManagerAddress }]) => {
      return sendSetDataAndTransferOwnershipTransactions(
        signer,
        erc725AccountAddress,
        keysToSet,
        valuesToSet,
        keyManagerAddress
      );
    }),
    shareReplay()
  );

  const transactions$ = pendingTransactionArray$.pipe(
    switchMap((transactions) => {
      return from(transactions);
    }),
    mergeMap(async (transaction) => {
      return {
        type: transaction.type,
        contractName: transaction.contractName,
        functionName: transaction.functionName,
        status: transaction.status,
        transaction: await transaction.pendingTransaction,
      } as DeploymentEventTransaction;
    }),
    shareReplay()
  );

  const receipts$ = transactions$.pipe(
    mergeMap(async (deploymentEvent) => {
      return {
        type: deploymentEvent.type,
        contractName: deploymentEvent.contractName,
        functionName: deploymentEvent.functionName,
        status: DeploymentStatus.COMPLETE,
        receipt: await deploymentEvent.transaction.wait(),
      } as DeploymentEventTransaction;
    }),
    shareReplay()
  );

  return concat(transactions$, receipts$);
}

export function prepareSetDataTransaction$(
  account$: Observable<LSP3AccountDeploymentEvent>,
  universalReceiver$: Observable<UniversalReveiverDeploymentEvent>,
  controllerAddresses: (string | ControllerOptions)[],
  lsp3ProfileData$: Observable<string | null>,
  isSignerUniversalProfile$: Observable<boolean>,
  defaultUniversalReceiverDelegateAddress?: string
) {
  const universalReceiverAddress$ = universalReceiver$.pipe(
    defaultIfEmpty({ receipt: null }),
    shareReplay()
  );

  return forkJoin([
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

        return prepareSetDataParameters(
          lsp3AccountAddress,
          universalReceiverDelegateAddress,
          controllerAddresses,
          lsp3ProfileData
        );
      }
    ),
    shareReplay()
  );
}

export async function getLsp3ProfileDataUrl(
  lsp3Profile: ProfileDataBeforeUpload | string,
  uploadOptions?: UploadOptions
): Promise<ProfileDataForEncoding> {
  let lsp3ProfileData: LSP3ProfileDataForEncoding;

  if (typeof lsp3Profile === 'string') {
    let lsp3JsonUrl = lsp3Profile;
    const isIPFSUrl = lsp3Profile.startsWith('ipfs://');

    if (isIPFSUrl) {
      lsp3JsonUrl = formatIPFSUrl(uploadOptions?.ipfsGateway, lsp3Profile.split('/').at(-1));
    }

    const ipfsResponse = await axios.get(lsp3JsonUrl);
    const lsp3ProfileJson = ipfsResponse.data;

    lsp3ProfileData = {
      url: lsp3Profile,
      json: lsp3ProfileJson as LSP3ProfileJSON,
    };
  } else {
    lsp3ProfileData = await UniversalProfile.uploadProfileData(lsp3Profile, uploadOptions);
  }

  return lsp3ProfileData;
}

async function getEncodedLSP3ProfileData(
  lsp3Profile: ProfileDataBeforeUpload | LSP3ProfileDataForEncoding | string,
  uploadOptions?: UploadOptions
): Promise<string> {
  let lsp3ProfileDataForEncoding: LSP3ProfileDataForEncoding;

  if (typeof lsp3Profile === 'string' || 'name' in lsp3Profile) {
    lsp3ProfileDataForEncoding = await getLsp3ProfileDataUrl(lsp3Profile, uploadOptions);
  } else {
    lsp3ProfileDataForEncoding = lsp3Profile;
  }

  const encodedDataResult = erc725EncodeData({ LSP3Profile: lsp3ProfileDataForEncoding });

  return encodedDataResult.LSP3Profile.value;
}

export function lsp3ProfileUpload$(
  lsp3Profile: ProfileDataBeforeUpload | LSP3ProfileDataForEncoding | string,
  uploadOptions?: UploadOptions
) {
  let lsp3Profile$: Observable<string>;

  if (typeof lsp3Profile !== 'string' || !isMetadataEncoded(lsp3Profile)) {
    lsp3Profile$ = lsp3Profile
      ? from(getEncodedLSP3ProfileData(lsp3Profile, uploadOptions)).pipe(shareReplay())
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
 * @param {LSP3ProfileDataForEncoding | string} encodedLSP3Profile
 *
 * @return {*}  Observable<LSP3AccountDeploymentEvent | DeploymentEventTransaction>
 */
export async function prepareSetDataParameters(
  erc725AccountAddress: string,
  universalReceiverDelegateAddress: string,
  controllerAddresses: (string | ControllerOptions)[],
  encodedLSP3Profile?: string
) {
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

  return {
    keysToSet,
    valuesToSet,
    erc725AccountAddress,
  };
}

export async function sendSetDataAndTransferOwnershipTransactions(
  signer: Signer,
  erc725AccountAddress: string,
  keysToSet: string[],
  valuesToSet: string[],
  keyManagerAddress: string
) {
  const erc725Account = new UniversalProfile__factory(signer).attach(erc725AccountAddress);
  const signerAddress = await signer.getAddress();

  const setDataEstimate = await erc725Account.estimateGas.setData(
    keysToSet,
    valuesToSet as BytesLike[],
    {
      gasPrice: GAS_PRICE,
    }
  );

  const transferOwnershipEstimate = await erc725Account.estimateGas.transferOwnership(
    keyManagerAddress,
    {
      from: signerAddress,
      gasPrice: GAS_PRICE,
    }
  );

  const setDataTransaction = erc725Account.setData(keysToSet, valuesToSet as BytesLike[], {
    gasLimit: setDataEstimate.add(GAS_BUFFER),
    gasPrice: GAS_PRICE,
  });

  const transferOwnershipTransaction = erc725Account.transferOwnership(keyManagerAddress, {
    from: signerAddress,
    gasLimit: transferOwnershipEstimate.add(GAS_BUFFER),
    gasPrice: GAS_PRICE,
  });

  return [
    {
      type: DeploymentType.TRANSACTION,
      contractName: ContractNames.ERC725_Account,
      status: DeploymentStatus.PENDING,
      functionName: 'setData(bytes32[],bytes[])',
      pendingTransaction: setDataTransaction,
    },
    {
      type: DeploymentType.TRANSACTION,
      contractName: ContractNames.ERC725_Account,
      status: DeploymentStatus.PENDING,
      functionName: 'transferOwnership(address)',
      pendingTransaction: transferOwnershipTransaction,
    },
  ];
}

export function prepareTransferOwnershipTransaction$(
  accountDeployment$: DeploymentEvent$,
  keyManagerDeployment$: DeploymentEvent$,
  isSignerUniversalProfile$: Observable<boolean>
) {
  return forkJoin([accountDeployment$, keyManagerDeployment$, isSignerUniversalProfile$]).pipe(
    switchMap(
      ([
        { receipt: lsp3AccountReceipt },
        { receipt: keyManagerReceipt },
        isSignerUniversalProfile,
      ]) => {
        const lsp3Address = isSignerUniversalProfile
          ? lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.logs[0].address
          : lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.to;

        const keyManagerAddress = isSignerUniversalProfile
          ? keyManagerReceipt.contractAddress ||
            '0x' + keyManagerReceipt.logs[0].topics[2].slice(26)
          : keyManagerReceipt.contractAddress || keyManagerReceipt.to;

        return of({
          lsp3Address,
          keyManagerAddress,
        });
      }
    ),
    shareReplay()
  );
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
  }).pipe(shareReplay());
}

export function convertUniversalProfileConfigurationObject(
  contractDeploymentOptions: ContractDeploymentOptions
): UniversalProfileDeploymentConfiguration {
  const erc725AccountConfig =
    contractDeploymentOptions?.LSP0ERC725Account || contractDeploymentOptions?.ERC725Account;

  const {
    version: erc725AccountVersion,
    byteCode: erc725AccountBytecode,
    libAddress: erc725AccountLibAddress,
  } = convertContractDeploymentOptionsVersion(erc725AccountConfig?.version);

  const {
    version: keyManagerVersion,
    byteCode: keyManagerBytecode,
    libAddress: keyManagerLibAddress,
  } = convertContractDeploymentOptionsVersion(contractDeploymentOptions?.LSP6KeyManager?.version);

  const {
    version: universalReceiverDelegateVersion,
    byteCode: universalReceiverDelegateBytecode,
    libAddress: universalReceiverDelegateLibAddress,
  } = convertContractDeploymentOptionsVersion(
    contractDeploymentOptions?.LSP1UniversalReceiverDelegate?.version
  );

  return {
    version: contractDeploymentOptions?.version,
    uploadOptions: contractDeploymentOptions?.ipfsGateway
      ? { ipfsGateway: contractDeploymentOptions?.ipfsGateway }
      : undefined,
    LSP0ERC725Account: {
      version: erc725AccountVersion,
      byteCode: erc725AccountBytecode,
      libAddress: erc725AccountLibAddress,
      deployProxy: erc725AccountConfig?.deployProxy,
    },
    LSP6KeyManager: {
      version: keyManagerVersion,
      byteCode: keyManagerBytecode,
      libAddress: keyManagerLibAddress,
      deployProxy: contractDeploymentOptions?.LSP6KeyManager?.deployProxy,
    },
    LSP1UniversalReceiverDelegate: {
      version: universalReceiverDelegateVersion,
      byteCode: universalReceiverDelegateBytecode,
      libAddress: universalReceiverDelegateLibAddress,
      deployProxy: contractDeploymentOptions?.LSP1UniversalReceiverDelegate?.deployProxy,
    },
    deployReactive: contractDeploymentOptions?.deployReactive,
  };
}
