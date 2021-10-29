import { TransactionReceipt } from '@ethersproject/providers';
import axios from 'axios';
import { Signer } from 'ethers';
import { concat, defer, EMPTY, forkJoin, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import { ERC725UniversalProfile, LSP3Account__factory } from '../..';
import { LSP3AccountInit__factory } from '../../tmp/Factories/LSP3AccountInit__factory';
import { ALL_PERMISSIONS, LSP3_UP_KEYS, PREFIX_PERMISSIONS } from '../helpers/config.helper';
import {
  deployContract,
  deployProxyContract,
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

export type ERC725AccountDeploymentEvent = DeploymentEventContract | DeploymentEventProxyContract;

export function accountDeployment$(
  signer: Signer,
  controllerAddresses: string[],
  baseContractAddresses$: Observable<{
    ERC725Account: string;
    UniversalReceiverAddressStore: string;
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
): Observable<ERC725AccountDeploymentEvent> {
  const accountDeployment$ = defer(() =>
    deployERC725Account(signer, controllerAddresses, baseContractAddress)
  ).pipe(shareReplay());

  const accountDeploymentReceipt$ = waitForReceipt<ERC725AccountDeploymentEvent>(
    accountDeployment$
  ).pipe(shareReplay());

  const accountDeploymentInitialize$ = baseContractAddress
    ? initializeProxy(signer, accountDeploymentReceipt$ as Observable<DeploymentEventProxyContract>)
    : EMPTY;

  const accountDeploymentInitializeReceipt$ = waitForReceipt<ERC725AccountDeploymentEvent>(
    accountDeploymentInitialize$
  ).pipe(shareReplay());

  return concat(
    accountDeployment$,
    accountDeploymentReceipt$,
    accountDeploymentInitialize$,
    accountDeploymentInitializeReceipt$
  );
}

async function deployERC725Account(
  signer: Signer,
  ownerAddresses: string[],
  baseContractAddress: string
): Promise<ERC725AccountDeploymentEvent> {
  const deploymentFunction = async () => {
    return baseContractAddress
      ? new LSP3AccountInit__factory(signer).attach(baseContractAddress)
      : await new LSP3Account__factory(signer).deploy(ownerAddresses[0]);
  };
  return baseContractAddress
    ? deployProxyContract(
        LSP3AccountInit__factory.abi,
        deploymentFunction,
        ContractNames.ERC725_ACCOUNT,
        signer
      )
    : deployContract(deploymentFunction, ContractNames.ERC725_ACCOUNT);
}

function initializeProxy(
  signer: Signer,
  accountDeploymentReceipt$: Observable<DeploymentEventProxyContract>
) {
  return initialize(accountDeploymentReceipt$, new LSP3AccountInit__factory(signer), async () => {
    const signerAddress = await signer.getAddress();
    return [signerAddress];
  }).pipe(shareReplay());
}

export function setDataTransaction$(
  signer: Signer,
  account$: Observable<ERC725AccountDeploymentEvent>,
  universalReceiver$: Observable<UniversalReveiverDeploymentEvent>,
  controllerAddresses: (string | ControllerOptions)[],
  lsp3ProfileData?: Promise<LSP3ProfileDataForEncoding>
) {
  const setDataTransaction$ = forkJoin([account$, universalReceiver$]).pipe(
    switchMap(
      ([{ receipt: erc725AccountReceipt }, { receipt: universalReceiverAddressStoreReceipt }]) => {
        return setData(
          signer,
          erc725AccountReceipt.contractAddress || erc725AccountReceipt.to,
          universalReceiverAddressStoreReceipt.contractAddress ||
            universalReceiverAddressStoreReceipt.to,
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
    lsp3ProfileData = await ERC725UniversalProfile.uploadProfileData(lsp3Profile);
  }

  return lsp3ProfileData;
}

/**
 * TODO: docs
 */
export async function setData(
  signer: Signer,
  erc725AccountAddress: string,
  universalReceiverAddressStoreAddress: string,
  controllerAddresses: (string | ControllerOptions)[],
  lsp3ProfileDataPromise?: Promise<LSP3ProfileDataForEncoding>
): Promise<DeploymentEventTransaction> {
  const lsp3ProfileData = lsp3ProfileDataPromise ? await lsp3ProfileDataPromise : null;

  const encodedData = lsp3ProfileData
    ? encodeLSP3Profile(lsp3ProfileData.profile, lsp3ProfileData.url)
    : null;

  const erc725Account = new LSP3Account__factory(signer).attach(erc725AccountAddress);

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
    PREFIX_PERMISSIONS + controllerAddress.substr(2), // TODO: handle multiple addresses
  ];

  const valuesToSet = [universalReceiverAddressStoreAddress, signerPermissions ?? ALL_PERMISSIONS];

  if (encodedData) {
    keysToSet.push(LSP3_UP_KEYS.LSP3_PROFILE);
    valuesToSet.push(encodedData.LSP3Profile.value);
  }

  const transaction = await erc725Account.setDataMultiple(keysToSet, valuesToSet);

  return {
    type: DeploymentType.TRANSACTION,
    contractName: ContractNames.ERC725_ACCOUNT,
    functionName: 'setDataMultiple',
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
    switchMap(([{ receipt: erc725AccountReceipt }, { receipt: keyManagerContract }]) => {
      return transferOwnership(signer, erc725AccountReceipt, keyManagerContract);
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
  erc725AccountReceipt: TransactionReceipt,
  keyManagerReceipt: TransactionReceipt
): Promise<DeploymentEventTransaction> {
  try {
    const signerAddress = await signer.getAddress();
    const contract = new LSP3Account__factory(signer).attach(
      erc725AccountReceipt.contractAddress || erc725AccountReceipt.to
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
      contractName: ContractNames.ERC725_ACCOUNT,
      functionName: 'transferOwnership',
      transaction,
    };
  } catch (error) {
    console.error('Error when transferring Ownership', error);
    throw error;
  }
}
