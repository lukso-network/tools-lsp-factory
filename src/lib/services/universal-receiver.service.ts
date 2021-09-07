import { Signer } from 'ethers';
import { concat, EMPTY, Observable } from 'rxjs';
import { shareReplay, switchMap, takeLast } from 'rxjs/operators';

import {
  DeploymentEvent,
  DeploymentEventContract,
  DeploymentEventProxyContract,
  UniversalReceiverAddressStore,
  UniversalReceiverAddressStore__factory,
} from '../..';
import { UniversalReceiverAddressStoreInit__factory } from '../../tmp/Factories/UniversalReceiverAddressStoreInit__factory';
import { UniversalReceiverAddressStoreInit } from '../../tmp/UniversalReceiverAddressStoreInit';
import {
  deployContract,
  deployProxyContract,
  initialize,
  waitForReceipt,
} from '../helpers/deployment.helper';

import { LSP3AccountDeploymentEvent } from './lsp3-account.service';

export type UniversalReveiverDeploymentEvent =
  | DeploymentEventContract<UniversalReceiverAddressStore>
  | DeploymentEventProxyContract<UniversalReceiverAddressStoreInit>;

export function universalReceiverAddressStoreDeployment$(
  signer: Signer,
  accountDeployment$: Observable<LSP3AccountDeploymentEvent>,
  masterContractAddress: string
): Observable<UniversalReveiverDeploymentEvent> {
  const universalReceiverAddressStoreDeployment$ = accountDeployment$.pipe(
    takeLast(1),
    switchMap((result) => {
      return deployUniversalReceiverAddressStore(
        signer,
        result.contract.address,
        masterContractAddress
      );
    }),
    shareReplay()
  );

  const universalReceiverAddressStoreReceipt$ = waitForReceipt<UniversalReveiverDeploymentEvent>(
    universalReceiverAddressStoreDeployment$
  );

  const universalReceiverAddressStoreInitialize$ = masterContractAddress
    ? initializeProxy(
        signer,
        universalReceiverAddressStoreReceipt$ as Observable<
          DeploymentEventProxyContract<UniversalReceiverAddressStoreInit>
        >
      )
    : EMPTY;

  return concat(
    universalReceiverAddressStoreDeployment$,
    universalReceiverAddressStoreReceipt$,
    universalReceiverAddressStoreInitialize$
  );
}

/**
 * TODO: docs
 */
export async function deployUniversalReceiverAddressStore(
  signer: Signer,
  lsp3AccountAddress: string,
  masterContractAddress: string
) {
  const deploymentFunction = async () => {
    return masterContractAddress
      ? new UniversalReceiverAddressStoreInit__factory(signer).attach(masterContractAddress)
      : await new UniversalReceiverAddressStore__factory(signer).deploy(lsp3AccountAddress, {
          gasLimit: 3_000_000,
        });
  };

  return masterContractAddress
    ? deployProxyContract<UniversalReceiverAddressStoreInit>(
        deploymentFunction,
        'UniversalReceiverAddressStore',
        signer,
        [lsp3AccountAddress]
      )
    : deployContract<UniversalReceiverAddressStore>(
        deploymentFunction,
        'UniversalReceiverAddressStore'
      );
}

function initializeProxy(
  signer: Signer,
  universalReceiverAddressStoreReceipt$: Observable<
    DeploymentEventProxyContract<UniversalReceiverAddressStoreInit>
  >
) {
  return initialize<UniversalReceiverAddressStoreInit>(
    universalReceiverAddressStoreReceipt$,
    new UniversalReceiverAddressStoreInit__factory(signer),
    (result: DeploymentEvent<UniversalReceiverAddressStoreInit>) => {
      console.log('result.contract.address 2');
      console.log(result);
      return result.initArguments;
    }
  );
}
