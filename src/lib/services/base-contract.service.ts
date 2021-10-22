import { Signer } from '@ethersproject/abstract-signer';
import { defer, EMPTY, merge, Observable } from 'rxjs';
import { shareReplay, switchMap, tap } from 'rxjs/operators';

import { ContractNames, DeploymentEventContract } from '../..';
import { LSP3AccountInit__factory } from '../../tmp/Factories/LSP3AccountInit__factory';
import { UniversalReceiverAddressStoreInit__factory } from '../../tmp/Factories/UniversalReceiverAddressStoreInit__factory';
import { deployContract, waitForReceipt } from '../helpers/deployment.helper';

import { LSP3AccountDeploymentEvent } from './lsp3-account.service';

export function baseContractsDeployment$(
  signer: Signer,
  chainId: number,
  baseContractByteCode$: Observable<[string, string]>
): Observable<LSP3AccountDeploymentEvent> {
  const lsp3AccountBaseContractDeploymentReceipt$ = deployBaseContract$(
    ContractNames.LSP3_ACCOUNT,
    chainId,
    () => {
      return new LSP3AccountInit__factory(signer).deploy();
    }
  );

  const universalReceiverBaseContractDeploymentReceipt$ = deployBaseContract$(
    ContractNames.UNIVERSAL_RECEIVER,
    chainId,
    () => {
      return new UniversalReceiverAddressStoreInit__factory(signer).deploy();
    }
  );

  const baseContractDeployment$ = baseContractByteCode$.pipe(
    switchMap(([lsp3BaseContractByteCode, universalReceiverBaseContractByteCode]) => {
      return merge(
        lsp3BaseContractByteCode !== '0x' ? EMPTY : lsp3AccountBaseContractDeploymentReceipt$,
        universalReceiverBaseContractByteCode !== '0x'
          ? EMPTY
          : universalReceiverBaseContractDeploymentReceipt$
      );
    })
  );

  return baseContractDeployment$;
}

function deployBaseContract$(contractName: ContractNames, chainId: number, deployContractFunction) {
  const deployBaseContract = () => {
    return deployContract(deployContractFunction, contractName);
  };

  const baseContractDeployment$ = defer(() => deployBaseContract()).pipe(shareReplay());

  const baseContractDeploymentReceipt$ = waitForReceipt<DeploymentEventContract>(
    baseContractDeployment$
  ).pipe(
    tap((contractDeploymentEvent) => {
      console.log(`Saving ${contractName} base contract address for chainId ${chainId}`); // TODO: Save base contract address somewhere
      console.log(contractDeploymentEvent.receipt.contractAddress);
    }),
    shareReplay()
  );

  return baseContractDeploymentReceipt$;
}
