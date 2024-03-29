import { ERC725 } from '@erc725/erc725.js';
import { ALL_PERMISSIONS, ERC725YDataKeys, INTERFACE_IDS } from '@lukso/lsp-smart-contracts';
import axios from 'axios';
import { BytesLike, Contract, ContractFactory, ethers, Signer } from 'ethers';
import { concat, defer, EMPTY, forkJoin, from, Observable, of } from 'rxjs';
import { defaultIfEmpty, shareReplay, switchMap, takeLast } from 'rxjs/operators';

import {
  LSP6KeyManager__factory,
  UniversalProfile,
  UniversalProfile__factory,
  UniversalProfileInit__factory,
} from '../..';
import { GAS_BUFFER, GAS_PRICE } from '../helpers/config.helper';
import {
  convertContractDeploymentOptionsVersion,
  deployContract,
  getContractAddressFromDeploymentEvent,
  getProxyByteCode,
  initialize,
  waitForBatchedPendingTransactions,
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
import {
  LSP3ProfileBeforeUpload,
  LSP3ProfileDataForEncoding,
  ProfileDataForEncoding,
} from '../interfaces/lsp3-profile';
import { UploadOptions } from '../interfaces/profile-upload-options';

import { UniversalReceiverDeploymentEvent as UniversalReceiverDeploymentEvent } from './universal-receiver.service';

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
  universalReceiver$: Observable<UniversalReceiverDeploymentEvent>,
  controllerAddresses: (string | ControllerOptions)[],
  lsp3ProfileData$: Observable<string | null>,
  isSignerUniversalProfile$: Observable<boolean>,
  keyManagerDeployment$: DeploymentEvent$,
  defaultUniversalReceiverDelegateAddress?: string
): Observable<DeploymentEventTransaction> {
  const setDataParameters$ = prepareSetDataTransaction$(
    signer,
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

  const pendingSetDataAndTransferOwnershipArray$ = forkJoin([
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

  const setDataAndTransferOwnership$ = waitForBatchedPendingTransactions(
    pendingSetDataAndTransferOwnershipArray$
  );

  const acceptOwnership$ = transferOwnershipParameters$.pipe(
    switchMap(({ keyManagerAddress, erc725AccountAddress }) => {
      return setDataAndTransferOwnership$.pipe(
        takeLast(1),
        switchMap(async () => {
          return acceptOwnership(signer, erc725AccountAddress, keyManagerAddress);
        })
      );
    }),
    shareReplay()
  );

  const acceptOwnershipReceipt$ = waitForReceipt<DeploymentEventTransaction>(acceptOwnership$);

  const revokeSignerPermissions$ = forkJoin([
    setDataParameters$,
    transferOwnershipParameters$,
  ]).pipe(
    switchMap(([{ erc725AccountAddress }, { keyManagerAddress }]) => {
      return acceptOwnershipReceipt$.pipe(
        switchMap(() => {
          return revokeSignerPermissions(
            signer,
            keyManagerAddress,
            erc725AccountAddress,
            controllerAddresses
          );
        })
      );
    }),
    shareReplay()
  );

  const revokeSignerPermissionsReceipt$ =
    waitForReceipt<DeploymentEventTransaction>(revokeSignerPermissions$);

  return concat(
    setDataAndTransferOwnership$,
    acceptOwnership$,
    acceptOwnershipReceipt$,
    revokeSignerPermissions$,
    revokeSignerPermissionsReceipt$
  );
}

export function prepareSetDataTransaction$(
  signer: Signer,
  account$: Observable<LSP3AccountDeploymentEvent>,
  universalReceiver$: Observable<UniversalReceiverDeploymentEvent>,
  controllerAddresses: (string | ControllerOptions)[],
  lsp3ProfileData$: Observable<string | null>,
  isSignerUniversalProfile$: Observable<boolean>,
  defaultUniversalReceiverDelegateAddress?: string
) {
  const universalReceiverAddress$: Observable<
    | UniversalReceiverDeploymentEvent
    | {
        receipt: null;
      }
  > = universalReceiver$.pipe(defaultIfEmpty({ receipt: null }), shareReplay());

  return forkJoin([
    account$,
    universalReceiverAddress$,
    lsp3ProfileData$,
    isSignerUniversalProfile$,
  ]).pipe(
    switchMap(
      ([lsp3Result, universalReceiverResult, lsp3ProfileData, isSignerUniversalProfile]) => {
        const { receipt: lsp3AccountReceipt } = lsp3Result;
        const { receipt: universalReceiverReceipt } = universalReceiverResult;

        const lsp3AccountAddress = isSignerUniversalProfile
          ? lsp3AccountReceipt.contractAddress || getContractAddressFromDeploymentEvent(lsp3Result)
          : lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.to;

        let universalReceiverAddress: string;
        if (isSignerUniversalProfile) {
          universalReceiverAddress =
            universalReceiverReceipt?.contractAddress || universalReceiverResult.receipt
              ? getContractAddressFromDeploymentEvent(
                  universalReceiverResult as UniversalReceiverDeploymentEvent
                )
              : null;
        } else {
          universalReceiverAddress =
            universalReceiverReceipt?.contractAddress || universalReceiverReceipt?.to;
        }

        return prepareSetDataParameters(
          signer,
          lsp3AccountAddress,
          universalReceiverAddress ?? defaultUniversalReceiverDelegateAddress,
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
    let lsp3VerifiableURI = lsp3Profile;
    const isIPFSUrl = lsp3Profile.startsWith('ipfs://');

    if (isIPFSUrl) {
      lsp3VerifiableURI = formatIPFSUrl(uploadOptions?.ipfsGateway, lsp3Profile.split('/').at(-1));
    }

    const ipfsResponse = await axios.get(lsp3VerifiableURI);
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

  const encodedDataResult = erc725EncodeData(lsp3ProfileDataForEncoding, 'LSP3Profile');

  return encodedDataResult.values[0];
}

export function lsp3ProfileUpload$(
  passedProfileData:
    | ProfileDataBeforeUpload
    | LSP3ProfileBeforeUpload
    | LSP3ProfileDataForEncoding
    | string,
  uploadOptions?: UploadOptions
) {
  let lsp3Profile$: Observable<string>;

  const lsp3Profile =
    typeof passedProfileData !== 'string' &&
    typeof passedProfileData !== 'undefined' &&
    'LSP3Profile' in passedProfileData
      ? passedProfileData?.LSP3Profile
      : passedProfileData;

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
 * @param {(string | ControllerOptions)[]} controllers
 * @param {LSP3ProfileDataForEncoding | string} encodedLSP3Profile
 *
 * @return {*}  Observable<LSP3AccountDeploymentEvent | DeploymentEventTransaction>
 */
export async function prepareSetDataParameters(
  signer: Signer,
  erc725AccountAddress: string,
  universalReceiverDelegateAddress: string,
  controllers: (string | ControllerOptions)[],
  encodedLSP3Profile?: string
) {
  const controllerAddresses: string[] = [];
  const controllerPermissions: string[] = [];

  controllers.map((controller, index) => {
    if (typeof controller === 'string') {
      controllerAddresses[index] = controller;
      controllerPermissions[index] = ALL_PERMISSIONS;
    } else {
      controllerAddresses[index] = controller.address;
      controllerPermissions[index] = controller.permissions;
    }
  });

  // see: https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-6-KeyManager.md#addresspermissionspermissionsaddress
  const addressPermissionsKeys = controllerAddresses.map(
    (address) => ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + address.substring(2)
  );

  // see: https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-6-KeyManager.md#addresspermissions
  const addressPermissionsArrayElements = controllerAddresses.map((_, index) => {
    const hexIndex = ethers.utils.hexlify([index]);

    return (
      ERC725YDataKeys.LSP6['AddressPermissions[]'].index +
      ethers.utils.hexZeroPad(hexIndex, 16).substring(2)
    );
  });

  const hexIndex = ethers.utils.hexlify([controllerAddresses.length]);

  const universalReceiverPermissionIndex =
    ERC725YDataKeys.LSP6['AddressPermissions[]'].index +
    ethers.utils.hexZeroPad(hexIndex, 16).substring(2);

  const keysToSet = [
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate,
    ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] +
      universalReceiverDelegateAddress.substring(2),
    ERC725YDataKeys.LSP6['AddressPermissions[]'].length,
    ...addressPermissionsArrayElements, // AddressPermission[index] = controllerAddress
    ...addressPermissionsKeys, // AddressPermissions:Permissions:<address> = controllerPermission,
    universalReceiverPermissionIndex,
  ];

  const valuesToSet = [
    universalReceiverDelegateAddress,
    ERC725.encodePermissions({ SUPER_SETDATA: true, REENTRANCY: true }),
    ethers.utils.hexZeroPad(ethers.utils.hexlify(controllerAddresses.length + 1), 16),
    ...controllerAddresses,
    ...controllerPermissions,
    universalReceiverDelegateAddress,
  ];

  // Set CHANGEOWNER + EDITPERMISSIONS for deploy key. Revoked after transfer ownerhip step is complete
  const signerAddress = await signer.getAddress();

  if (!controllerAddresses.includes(signerAddress)) {
    keysToSet.push(
      ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + signerAddress.substring(2)
    );
    valuesToSet.push(ERC725.encodePermissions({ CHANGEOWNER: true, EDITPERMISSIONS: true }));
  } else {
    valuesToSet[
      keysToSet.indexOf(
        ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + signerAddress.substring(2)
      )
    ] = ERC725.encodePermissions({ CHANGEOWNER: true, EDITPERMISSIONS: true });
  }

  if (encodedLSP3Profile) {
    keysToSet.push(ERC725YDataKeys.LSP3.LSP3Profile);
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

  const setDataEstimate = await erc725Account.estimateGas.setDataBatch(
    keysToSet,
    valuesToSet as BytesLike[]
  );

  const transferOwnershipEstimate = await erc725Account.estimateGas.transferOwnership(
    keyManagerAddress,
    {
      from: signerAddress,
    }
  );

  // Send batched transactions together
  const setDataTransaction = erc725Account.setDataBatch(keysToSet, valuesToSet as BytesLike[], {
    gasLimit: setDataEstimate.add(GAS_BUFFER),
    gasPrice: GAS_PRICE,
    from: signerAddress,
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
      functionName: 'setDataBatch(bytes32[],bytes[])',
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

export async function acceptOwnership(
  signer: Signer,
  erc725AccountAddress: string,
  keyManagerAddress: string
): Promise<DeploymentEventTransaction> {
  const erc725Account = new UniversalProfile__factory(signer).attach(erc725AccountAddress);
  const signerAddress = await signer.getAddress();

  const acceptOwnershipPayload = erc725Account.interface.getSighash('acceptOwnership');
  const keyManager = new LSP6KeyManager__factory(signer).attach(keyManagerAddress);

  const acceptOwnershipEstimate = await keyManager.estimateGas['execute(bytes)'](
    acceptOwnershipPayload,
    {
      from: signerAddress,
    }
  );

  const acceptOwnershipTransaction = await keyManager['execute(bytes)'](acceptOwnershipPayload, {
    from: signerAddress,
    gasPrice: GAS_PRICE,
    gasLimit: acceptOwnershipEstimate.add(GAS_BUFFER),
  });

  return {
    type: DeploymentType.TRANSACTION,
    contractName: ContractNames.ERC725_Account,
    status: DeploymentStatus.PENDING,
    functionName: 'acceptOwnership()',
    transaction: acceptOwnershipTransaction,
  };
}

export async function revokeSignerPermissions(
  signer: Signer,
  keyManagerAddress: string,
  erc725AccountAddress: string,
  controllers: (string | ControllerOptions)[]
): Promise<DeploymentEventTransaction> {
  const erc725Account = new UniversalProfile__factory(signer).attach(erc725AccountAddress);
  const keyManager = new LSP6KeyManager__factory(signer).attach(keyManagerAddress);
  const signerAddress = await signer.getAddress();

  const controllerAddress = controllers.map((controller) => {
    return typeof controller === 'string' ? controller : controller.address;
  });

  let signerPermission: string;

  if (controllerAddress.includes(signerAddress)) {
    const controller = controllers[controllerAddress.indexOf(signerAddress)];
    signerPermission =
      typeof controller === 'string' ? ALL_PERMISSIONS : controller.permissions ?? ALL_PERMISSIONS;
  } else {
    signerPermission = ERC725.encodePermissions({});
  }

  const revokeSignerPermissionsPayload = erc725Account.interface.encodeFunctionData('setData', [
    ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + signerAddress.substring(2),
    signerPermission,
  ]);

  const revokeSignerPermissionsEstimate = await keyManager.estimateGas['execute(bytes)'](
    revokeSignerPermissionsPayload,
    {
      from: signerAddress,
    }
  );

  const revokeSignerPermissionsTransaction = await keyManager['execute(bytes)'](
    revokeSignerPermissionsPayload,
    {
      from: signerAddress,
      gasPrice: GAS_PRICE,
      gasLimit: revokeSignerPermissionsEstimate.add(GAS_BUFFER),
    }
  );

  return {
    type: DeploymentType.TRANSACTION,
    contractName: ContractNames.ERC725_Account,
    status: DeploymentStatus.PENDING,
    functionName: 'setData(bytes32,bytes)',
    transaction: revokeSignerPermissionsTransaction,
  };
}

export function prepareTransferOwnershipTransaction$(
  accountDeployment$: DeploymentEvent$,
  keyManagerDeployment$: DeploymentEvent$,
  isSignerUniversalProfile$: Observable<boolean>
) {
  return forkJoin([accountDeployment$, keyManagerDeployment$, isSignerUniversalProfile$]).pipe(
    switchMap(([lsp3Result, keyManagerResult, isSignerUniversalProfile]) => {
      const { receipt: lsp3AccountReceipt } = lsp3Result;
      const { receipt: keyManagerReceipt } = keyManagerResult;

      const erc725AccountAddress = isSignerUniversalProfile
        ? lsp3AccountReceipt.contractAddress || getContractAddressFromDeploymentEvent(lsp3Result)
        : lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.to;

      const keyManagerAddress = isSignerUniversalProfile
        ? keyManagerReceipt.contractAddress ||
          getContractAddressFromDeploymentEvent(keyManagerResult)
        : keyManagerReceipt.contractAddress || keyManagerReceipt.to;

      return of({
        erc725AccountAddress,
        keyManagerAddress,
      });
    }),
    shareReplay()
  );
}

export function isSignerUniversalProfile$(signer: Signer) {
  return defer(async () => {
    const signerAddress = await signer.getAddress();
    return await addressIsUniversalProfile(signerAddress, signer);
  }).pipe(shareReplay());
}

export async function addressIsUniversalProfile(address: string, signer: Signer) {
  try {
    const universalProfile = UniversalProfile__factory.connect(address, signer);

    let isUniversalProfile = await universalProfile.supportsInterface(
      INTERFACE_IDS.LSP0ERC725Account
    );

    if (!isUniversalProfile) {
      isUniversalProfile = await universalProfile.supportsInterface('0x63cb749b');
    }

    return isUniversalProfile;
  } catch (error) {
    return false;
  }
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
  };
}
