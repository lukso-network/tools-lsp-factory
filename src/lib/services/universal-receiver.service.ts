import { Signer } from 'ethers';
import { concat, EMPTY, Observable } from 'rxjs';
import { shareReplay, switchMap, takeLast } from 'rxjs/operators';

import {
  DeploymentEvent,
  DeploymentEventContract,
  DeploymentEventProxyContract,
  UniversalReceiverAddressStore__factory,
} from '../..';
import { UniversalReceiverAddressStoreInit__factory } from '../../tmp/Factories/UniversalReceiverAddressStoreInit__factory';
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

export function universalReceiverAddressStoreDeployment$(
  signer: Signer,
  accountDeployment$: Observable<LSP3AccountDeploymentEvent>,
  baseContractAddress: string
): Observable<UniversalReveiverDeploymentEvent> {
  const universalReceiverAddressStoreDeployment$ = accountDeployment$.pipe(
    takeLast(1),
    switchMap((result) => {
      return deployUniversalReceiverAddressStore(
        signer,
        result.receipt.contractAddress,
        baseContractAddress
      );
    }),
    shareReplay()
  );

  const universalReceiverAddressStoreReceipt$ = waitForReceipt<UniversalReveiverDeploymentEvent>(
    universalReceiverAddressStoreDeployment$
  );

  const universalReceiverAddressStoreInitialize$ = baseContractAddress
    ? initializeProxy(
        signer,
        universalReceiverAddressStoreReceipt$ as Observable<DeploymentEventProxyContract>
      )
    : EMPTY;

  const universalReceiverAddressStoreInitializeReceipt$ =
    waitForReceipt<UniversalReveiverDeploymentEvent>(universalReceiverAddressStoreInitialize$);

  return concat(
    universalReceiverAddressStoreDeployment$,
    universalReceiverAddressStoreReceipt$,
    universalReceiverAddressStoreInitialize$,
    universalReceiverAddressStoreInitializeReceipt$
  );
}

/**
 * TODO: docs
 */
export async function deployUniversalReceiverAddressStore(
  signer: Signer,
  lsp3AccountAddress: string,
  baseContractAddress: string
) {
  const deploymentFunction = async () => {
    return baseContractAddress
      ? new UniversalReceiverAddressStoreInit__factory(signer).attach(baseContractAddress)
      : await new UniversalReceiverAddressStore__factory(signer).deploy(lsp3AccountAddress, {
          gasLimit: 3_000_000,
        });
  };

  return baseContractAddress
    ? deployProxyContract(deploymentFunction, ContractNames.UNIVERSAL_RECEIVER, signer)
    : deployContract(deploymentFunction, ContractNames.UNIVERSAL_RECEIVER);
}

function initializeProxy(
  signer: Signer,
  universalReceiverAddressStoreReceipt$: Observable<DeploymentEventProxyContract>
) {
  return initialize(
    universalReceiverAddressStoreReceipt$,
    new UniversalReceiverAddressStoreInit__factory(signer),
    (result: DeploymentEvent) => {
      return [result.receipt.contractAddress];
    }
  );
}
