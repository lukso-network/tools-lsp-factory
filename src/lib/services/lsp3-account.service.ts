import { Signer } from 'ethers';
import { concat, defer, EMPTY, forkJoin, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import {
  KeyManager,
  LSP3Account,
  LSP3Account__factory,
  UniversalReceiverAddressStore,
} from '../..';
import { LSP3AccountInit__factory } from '../../tmp/Factories/LSP3AccountInit__factory';
import { LSP3AccountInit } from '../../tmp/LSP3AccountInit';
import { UniversalReceiverAddressStoreInit } from '../../tmp/UniversalReceiverAddressStoreInit';
import { ALL_PERMISSIONS, LSP3_UP_KEYS, PREFIX_PERMISSIONS } from '../helpers/config.helper';
import {
  deployContract,
  deployProxyContract,
  initialize,
  waitForReceipt,
} from '../helpers/deployment.helper';
import { encodeLSP3Profile } from '../helpers/erc725.helper';
import {
  DeploymentEvent,
  DeploymentEvent$,
  DeploymentEventContract,
  DeploymentEventProxyContract,
  DeploymentEventStatus,
  DeploymentEventTransaction,
  DeploymentEventType,
  ProfileDeploymentOptions,
} from '../interfaces';

import { UniversalReveiverDeploymentEvent } from './universal-receiver.service';

export type LSP3AccountDeploymentEvent =
  | DeploymentEventContract<LSP3Account>
  | DeploymentEventProxyContract<LSP3AccountInit>;

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
        accountDeploymentReceipt$ as Observable<DeploymentEventProxyContract<LSP3AccountInit>>
      )
    : EMPTY;

  return concat(accountDeployment$, accountDeploymentReceipt$, accountDeploymentInitialize$);
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
    ? deployProxyContract<LSP3AccountInit>(deploymentFunction, 'LSP3Account', signer, [
        ownerAddresses[0],
      ])
    : deployContract<LSP3Account>(deploymentFunction, 'LSP3Account');
}

function initializeProxy(
  signer: Signer,
  accountDeploymentReceipt$: Observable<DeploymentEventProxyContract<LSP3AccountInit>>
) {
  return initialize<LSP3AccountInit>(
    accountDeploymentReceipt$,
    new LSP3AccountInit__factory(signer),
    (result: DeploymentEvent<LSP3AccountInit>) => {
      return result.initArguments;
    }
  ).pipe(shareReplay());
}

export function setDataTransaction$(
  account$: Observable<LSP3AccountDeploymentEvent>,
  universalReceiver$: Observable<UniversalReveiverDeploymentEvent>,
  profileDeploymentOptions: ProfileDeploymentOptions
) {
  const setDataTransaction$ = forkJoin([account$, universalReceiver$]).pipe(
    switchMap(
      ([{ contract: lsp3AccountContract }, { contract: universalReceiverAddressStore }]) => {
        return setData(
          lsp3AccountContract,
          universalReceiverAddressStore,
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
  erc725Account: LSP3Account | LSP3AccountInit,
  universalReceiverAddressStore: UniversalReceiverAddressStore | UniversalReceiverAddressStoreInit,
  profileDeploymentOptions: ProfileDeploymentOptions
): Promise<DeploymentEventTransaction> {
  const { json, url } = profileDeploymentOptions.lsp3Profile;
  const encodedData = encodeLSP3Profile({ ...json }, url);
  const transaction = await erc725Account.setDataMultiple(
    [
      LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY,
      LSP3_UP_KEYS.LSP3_PROFILE,
      PREFIX_PERMISSIONS + profileDeploymentOptions.controllerAddresses[0].substr(2), // TODO: handle multiple addresses
    ],
    [universalReceiverAddressStore.address, encodedData.LSP3Profile.value, ALL_PERMISSIONS]
  );

  return {
    type: DeploymentEventType.TRANSACTION,
    status: DeploymentEventStatus.DEPLOYING,
    name: 'SET_DATA',
    transaction,
  };
}

export function getTransferOwnershipTransaction$(
  signer: Signer,
  accountDeployment$: DeploymentEvent$<LSP3AccountInit | LSP3Account>,
  keyManagerDeployment$: DeploymentEvent$<KeyManager>
) {
  const transferOwnershipTransaction$ = forkJoin([accountDeployment$, keyManagerDeployment$]).pipe(
    switchMap(([{ contract: lsp3AccountContract }, { contract: keyManagerContract }]) => {
      console.count('transferOwnership');
      return transferOwnership(signer, lsp3AccountContract, keyManagerContract);
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
  lsp3Account: LSP3Account | LSP3AccountInit,
  keyManager: KeyManager
): Promise<DeploymentEventTransaction> {
  try {
    const signerAddress = await signer.getAddress();
    const owner = await lsp3Account.owner();

    console.log(owner, signerAddress);
    const transaction = await lsp3Account.transferOwnership(keyManager.address, {
      from: signerAddress,
    });

    return {
      type: DeploymentEventType.TRANSACTION,
      status: DeploymentEventStatus.DEPLOYING,
      name: 'TRANSFER_OWNERSHIP',
      transaction,
    };
  } catch (error) {
    console.error('Error when transferring Ownership', error);
    throw error;
  }
}
