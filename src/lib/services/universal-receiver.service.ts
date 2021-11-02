import { Signer } from 'ethers';
import { concat, EMPTY, Observable } from 'rxjs';
import { shareReplay, switchMap, takeLast } from 'rxjs/operators';

import {
  DeploymentEventContract,
  DeploymentEventProxyContract,
  UniversalReceiverDelegate__factory,
  UniversalReceiverDelegateInit__factory,
} from '../..';
import {
  deployContract,
  deployProxyContract,
  initialize,
  waitForReceipt,
} from '../helpers/deployment.helper';
import { ContractNames } from '../interfaces';

import { LSP3AccountDeploymentEvent } from './lsp3-account.service';

export type UniversalReveiverDeploymentEvent =
  | DeploymentEventContract
  | DeploymentEventProxyContract;

export function universalReceiverDelegateDeployment$(
  signer: Signer,
  accountDeployment$: Observable<LSP3AccountDeploymentEvent>,
  baseContractDeployment$: Observable<{
    [ContractNames.ERC725_Account]: string;
    [ContractNames.UNIVERSAL_RECEIVER]: string;
  }>
) {
  return baseContractDeployment$.pipe(
    switchMap((baseContractAddresses) => {
      return universalReceiverDelegateDeploymentWithBaseContractAddress$(
        signer,
        accountDeployment$,
        baseContractAddresses.UniversalReceiverDelegate
      );
    }),
    shareReplay()
  );
}

export function universalReceiverDelegateDeploymentWithBaseContractAddress$(
  signer: Signer,
  accountDeployment$: Observable<LSP3AccountDeploymentEvent>,
  baseContractAddress: string
): Observable<UniversalReveiverDeploymentEvent> {
  const universalReceiverDelegateDeployment$ = accountDeployment$.pipe(
    takeLast(1),
    switchMap((result) => {
      return deployUniversalReceiverDelegateStore(
        signer,
        result.receipt.contractAddress,
        baseContractAddress
      );
    }),
    shareReplay()
  );

  const universalReceiverDelegateStoreReceipt$ = waitForReceipt<UniversalReveiverDeploymentEvent>(
    universalReceiverDelegateDeployment$
  );

  const universalReceiverDelegateInitialize$ = baseContractAddress
    ? initializeProxy(
        signer,
        universalReceiverDelegateStoreReceipt$ as Observable<DeploymentEventProxyContract>
      )
    : EMPTY;

  const universalReceiverDelegateInitializeReceipt$ =
    waitForReceipt<UniversalReveiverDeploymentEvent>(universalReceiverDelegateInitialize$);

  return concat(
    universalReceiverDelegateDeployment$,
    universalReceiverDelegateStoreReceipt$,
    universalReceiverDelegateInitialize$,
    universalReceiverDelegateInitializeReceipt$
  );
}

/**
 * TODO: docs
 */
export async function deployUniversalReceiverDelegateStore(
  signer: Signer,
  lsp3AccountAddress: string,
  baseContractAddress: string
) {
  lsp3AccountAddress;
  const deploymentFunction = async () => {
    return baseContractAddress
      ? new UniversalReceiverDelegateInit__factory(signer).attach(baseContractAddress)
      : await new UniversalReceiverDelegate__factory(signer).deploy({
          gasLimit: 3_000_000,
        });
  };

  return baseContractAddress
    ? deployProxyContract(
        UniversalReceiverDelegateInit__factory.abi,
        deploymentFunction,
        ContractNames.UNIVERSAL_RECEIVER,
        signer
      )
    : deployContract(deploymentFunction, ContractNames.UNIVERSAL_RECEIVER);
}

function initializeProxy(
  signer: Signer,
  universalReceiverDelegateReceipt$: Observable<DeploymentEventProxyContract>
) {
  return initialize(
    universalReceiverDelegateReceipt$,
    new UniversalReceiverDelegateInit__factory(signer),
    async () => {
      return [];
    }
  );
}
