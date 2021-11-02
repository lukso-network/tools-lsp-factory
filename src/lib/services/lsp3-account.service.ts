import { TransactionReceipt } from '@ethersproject/providers';
import axios from 'axios';
import { BytesLike, Contract, ContractFactory, Signer } from 'ethers';
import { concat, defer, EMPTY, forkJoin, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import {
  LSP3UniversalProfile,
  UniversalProfile__factory,
  UniversalProfileInit__factory,
} from '../..';
import {
  ADDRESS_PERMISSIONS_ARRAY_KEY,
  ALL_PERMISSIONS,
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
  lsp3ProfileData?: Promise<LSP3ProfileDataForEncoding>
) {
  const setDataTransaction$ = forkJoin([account$, universalReceiver$]).pipe(
    switchMap(
      ([{ receipt: lsp3AccountReceipt }, { receipt: universalReceiverDelegateReceipt }]) => {
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
    const lsp3JsonUrl = lsp3Profile;
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

/**
 * TODO: docs
 */
export async function setData(
  signer: Signer,
  erc725AccountAddress: string,
  universalReceiverDelegateAddress: string,
  controllerAddresses: (string | ControllerOptions)[],
  lsp3ProfileDataPromise?: Promise<LSP3ProfileDataForEncoding>
): Promise<DeploymentEventTransaction> {
  const lsp3ProfileData = lsp3ProfileDataPromise ? await lsp3ProfileDataPromise : null;

  const encodedData = lsp3ProfileData
    ? encodeLSP3Profile(lsp3ProfileData.profile, lsp3ProfileData.url)
    : null;

  const erc725Account = new UniversalProfile__factory(signer).attach(erc725AccountAddress);

  let controllerAddress: string;
  let signerPermissions: string;

  if (typeof controllerAddresses[0] === 'string') {
    controllerAddress = controllerAddresses[0];
  } else {
    controllerAddress = controllerAddresses[0].address;
    signerPermissions = controllerAddresses[0].permissions;
  }

  const keysToSet = [
    LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY,
    PREFIX_PERMISSIONS + controllerAddress.substr(2), // TODO: handle multiple addresses,
    PREFIX_PERMISSIONS + universalReceiverDelegateAddress.substr(2),
    ADDRESS_PERMISSIONS_ARRAY_KEY,
    ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) + '00000000000000000000000000000000',
    ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) + '00000000000000000000000000000001',
  ];

  const valuesToSet = [
    universalReceiverDelegateAddress,
    signerPermissions ?? ALL_PERMISSIONS,
    SET_DATA_PERMISSION,
    2,
    controllerAddress,
    universalReceiverDelegateAddress,
  ];

  if (encodedData) {
    keysToSet.push(LSP3_UP_KEYS.LSP3_PROFILE);
    valuesToSet.push(encodedData.LSP3Profile.value);
  }

  const transaction = await erc725Account.setData(keysToSet, valuesToSet as BytesLike[], {
    gasLimit: 500_000,
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
 * TODO: docs
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
    const transaction = await contract.transferOwnership(
      keyManagerReceipt.contractAddress || keyManagerReceipt.to,
      {
        from: signerAddress,
        gasLimit: 500_000,
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
