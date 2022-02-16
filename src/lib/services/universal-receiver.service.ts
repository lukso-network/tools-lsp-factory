import { Signer } from 'ethers';
import { concat, EMPTY, from, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import {
  DeploymentEventContract,
  DeploymentEventProxyContract,
  LSP1UniversalReceiverDelegate__factory,
  LSP1UniversalReceiverDelegateInit__factory,
} from '../..';
import {
  deployContract,
  deployProxyContract,
  initialize,
  waitForReceipt,
} from '../helpers/deployment.helper';
import { BaseContractAddresses, ContractNames } from '../interfaces';

export type UniversalReveiverDeploymentEvent =
  | DeploymentEventContract
  | DeploymentEventProxyContract;

export function universalReceiverDelegateDeployment$(
  signer: Signer,
  baseContractDeployment$: Observable<BaseContractAddresses>
) {
  return baseContractDeployment$.pipe(
    switchMap((baseContractAddresses) => {
      return universalReceiverDelegateDeploymentWithBaseContractAddress$(
        signer,
        baseContractAddresses.UniversalReceiverDelegate
      );
    }),
    shareReplay()
  );
}

export function universalReceiverDelegateDeploymentWithBaseContractAddress$(
  signer: Signer,
  baseContractAddress: string
): Observable<UniversalReveiverDeploymentEvent> {
  const universalReceiverDelegateDeployment$ = from(
    deployUniversalReceiverDelegate(signer, baseContractAddress)
  ).pipe(shareReplay());

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
 * Deploys a UniversalReceiverDelegate contract
 *
 * Returns a DeploymentEvent Promise
 *
 * @param {Signer} signer
 * @param {string} baseContractAddress
 * @return {*}  Promise<DeploymentEventStandardContract | DeploymentEventProxyContract>
 * @memberof LSP3UniversalProfile
 */
export async function deployUniversalReceiverDelegate(signer: Signer, baseContractAddress: string) {
  const deploymentFunction = async () => {
    return baseContractAddress
      ? new LSP1UniversalReceiverDelegateInit__factory(signer).attach(baseContractAddress)
      : await new LSP1UniversalReceiverDelegate__factory(signer).deploy({
          gasLimit: 3_000_000,
        });
  };

  return baseContractAddress
    ? deployProxyContract(
        LSP1UniversalReceiverDelegateInit__factory.abi,
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
    new LSP1UniversalReceiverDelegateInit__factory(signer),
    async () => {
      return [];
    }
  );
}
