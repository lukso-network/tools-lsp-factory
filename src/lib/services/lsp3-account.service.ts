import { TransactionReceipt } from '@ethersproject/providers';
import { Signer } from 'ethers';
import { concat, defer, EMPTY, forkJoin, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import { LSP3Account__factory } from '../..';
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
  DeploymentEvent$,
  DeploymentEventContract,
  DeploymentEventProxyContract,
  DeploymentEventTransaction,
  DeploymentStatus,
  DeploymentType,
  ProfileDeploymentOptions,
} from '../interfaces';

import { UniversalReveiverDeploymentEvent } from './universal-receiver.service';

export type LSP3AccountDeploymentEvent = DeploymentEventContract | DeploymentEventProxyContract;

export function accountDeployment$(
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
    ? initializeProxy(
        signer,
        accountDeploymentReceipt$ as Observable<DeploymentEventProxyContract>,
        controllerAddresses
      )
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
      ? new LSP3AccountInit__factory(signer).attach(baseContractAddress)
      : await new LSP3Account__factory(signer).deploy(ownerAddresses[0]);
  };
  return baseContractAddress
    ? deployProxyContract(deploymentFunction, ContractNames.LSP3_ACCOUNT, signer)
    : deployContract(deploymentFunction, ContractNames.LSP3_ACCOUNT);
}

function initializeProxy(
  signer: Signer,
  accountDeploymentReceipt$: Observable<DeploymentEventProxyContract>,
  controllerAddresses: string[]
) {
  return initialize(accountDeploymentReceipt$, new LSP3AccountInit__factory(signer), () => {
    return [controllerAddresses[0]];
  }).pipe(shareReplay());
}

export function setDataTransaction$(
  signer: Signer,
  account$: Observable<LSP3AccountDeploymentEvent>,
  universalReceiver$: Observable<UniversalReveiverDeploymentEvent>,
  profileDeploymentOptions: ProfileDeploymentOptions
) {
  const setDataTransaction$ = forkJoin([account$, universalReceiver$]).pipe(
    switchMap(
      ([{ receipt: lsp3AccountReceipt }, { receipt: universalReceiverAddressStoreReceipt }]) => {
        return setData(
          signer,
          lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.to,
          universalReceiverAddressStoreReceipt.contractAddress ||
            universalReceiverAddressStoreReceipt.to,
          profileDeploymentOptions
        );
      }
    ),
    shareReplay()
  );

  const setDataReceipt$ = waitForReceipt<DeploymentEventTransaction>(setDataTransaction$);
  return concat(setDataTransaction$, setDataReceipt$);
}

/**
 * TODO: docs
 */
export async function setData(
  signer: Signer,
  erc725AccountAddress: string,
  universalReceiverAddressStoreAddress: string,
  profileDeploymentOptions: ProfileDeploymentOptions
): Promise<DeploymentEventTransaction> {
  const { json, url } = profileDeploymentOptions.lsp3Profile;
  const encodedData = encodeLSP3Profile({ ...json }, url);
  const erc725Account = new LSP3Account__factory(signer).attach(erc725AccountAddress);
  const transaction = await erc725Account.setDataMultiple(
    [
      LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY,
      LSP3_UP_KEYS.LSP3_PROFILE,
      PREFIX_PERMISSIONS + profileDeploymentOptions.controllerAddresses[0].substr(2), // TODO: handle multiple addresses
    ],
    [universalReceiverAddressStoreAddress, encodedData.LSP3Profile.value, ALL_PERMISSIONS]
  );

  return {
    type: DeploymentType.TRANSACTION,
    contractName: ContractNames.LSP3_ACCOUNT,
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
    const contract = new LSP3Account__factory(signer).attach(
      lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.to
    );
    const transaction = await contract.transferOwnership(
      keyManagerReceipt.contractAddress || keyManagerReceipt.to,
      {
        from: signerAddress,
      }
    );

    return {
      type: DeploymentType.TRANSACTION,
      status: DeploymentStatus.PENDING,
      contractName: ContractNames.LSP3_ACCOUNT,
      functionName: 'transferOwnership',
      transaction,
    };
  } catch (error) {
    console.error('Error when transferring Ownership', error);
    throw error;
  }
}
