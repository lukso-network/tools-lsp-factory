import { Signer } from 'ethers';
import { concat, EMPTY, forkJoin, from, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import { LSP6KeyManager__factory, LSP6KeyManagerInit__factory } from '../..';
import {
  deployContract,
  deployProxyContract,
  initialize,
  waitForReceipt,
} from '../helpers/deployment.helper';
import {
  BaseContractAddresses,
  ContractNames,
  DeploymentEventContract,
  DeploymentEventProxyContract,
} from '../interfaces';

import { LSP3AccountDeploymentEvent } from './lsp3-account.service';

export type KeyManagerDeploymentEvent = DeploymentEventContract;

export function keyManagerDeployment$(
  signer: Signer,
  accountDeployment$: Observable<LSP3AccountDeploymentEvent>,
  baseContractAddress$: Observable<BaseContractAddresses>
): Observable<KeyManagerDeploymentEvent> {
  return forkJoin([accountDeployment$, baseContractAddress$]).pipe(
    switchMap(([{ receipt: lsp3AccountReceipt }, baseContractAddress]) => {
      const erc725AccountAddress = lsp3AccountReceipt.contractAddress || lsp3AccountReceipt.to;
      return keyManagerDeploymentForAccount$(
        signer,
        erc725AccountAddress,
        baseContractAddress.KeyManager
      );
    }),
    shareReplay()
  );
}

function keyManagerDeploymentForAccount$(
  signer: Signer,
  erc725AccountAddress: string,
  baseContractAddress: string
): Observable<KeyManagerDeploymentEvent> {
  const keyManagerDeployment$ = from(
    deployKeyManager(signer, erc725AccountAddress, baseContractAddress)
  ).pipe(shareReplay());

  const keyManagerDeploymentReceipt$ = waitForReceipt<KeyManagerDeploymentEvent>(
    keyManagerDeployment$
  ).pipe(shareReplay());

  const keyManagerInitialize$ = baseContractAddress
    ? initializeProxy(
        signer,
        keyManagerDeploymentReceipt$ as Observable<DeploymentEventProxyContract>,
        erc725AccountAddress
      )
    : EMPTY;

  const keyManagerInitializeReceipt$ =
    waitForReceipt<KeyManagerDeploymentEvent>(keyManagerInitialize$);

  return concat(
    keyManagerDeployment$,
    keyManagerDeploymentReceipt$,
    keyManagerInitialize$,
    keyManagerInitializeReceipt$
  );
}
/**
 * Deploys KeyManager contract for a UniversalProfile
 *
 * @param {Signer} signer
 * @param {string} lsp3AccountAddress
 * @param {string} baseContractAddress
 *
 * @return {*} Promise<DeploymentEventStandardContract>
 */
export async function deployKeyManager(
  signer: Signer,
  lsp3AccountAddress: string,
  baseContractAddress: string
) {
  const deploymentFunction = async () => {
    return baseContractAddress
      ? new LSP6KeyManagerInit__factory(signer).attach(baseContractAddress)
      : await new LSP6KeyManager__factory(signer).deploy(lsp3AccountAddress, {
          gasLimit: 3_000_000,
        });
  };

  return baseContractAddress
    ? deployProxyContract(
        LSP6KeyManagerInit__factory.abi,
        deploymentFunction,
        ContractNames.KEY_MANAGER,
        signer
      )
    : deployContract(deploymentFunction, ContractNames.KEY_MANAGER);
}

function initializeProxy(
  signer: Signer,
  keyManagerDeploymentReceipt$: Observable<DeploymentEventProxyContract>,
  accountAddress: string
) {
  return initialize(
    keyManagerDeploymentReceipt$,
    new LSP6KeyManagerInit__factory(signer),
    async () => {
      return [accountAddress];
    }
  );
}
