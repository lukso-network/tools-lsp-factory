import { Signer } from '@ethersproject/abstract-signer';
import { defer, EMPTY, merge, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import { ContractNames, DeploymentEventContract } from '../..';
import { LSP3AccountInit__factory } from '../../tmp/Factories/LSP3AccountInit__factory';
import { UniversalReceiverAddressStoreInit__factory } from '../../tmp/Factories/UniversalReceiverAddressStoreInit__factory';
import { deployBaseContract, waitForReceipt } from '../helpers/deployment.helper';

export function baseContractsDeployment$(
  signer: Signer,
  baseContractByteCode$: Observable<[string, string]>
): Observable<DeploymentEventContract> {
  const lsp3AccountBaseContractDeploymentReceipt$ = deployBaseContract$(
    ContractNames.LSP3_ACCOUNT,
    () => {
      return new LSP3AccountInit__factory(signer).deploy();
    }
  );

  const universalReceiverBaseContractDeploymentReceipt$ = deployBaseContract$(
    ContractNames.UNIVERSAL_RECEIVER,
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

function deployBaseContract$(contractName: ContractNames, deployContractFunction) {
  const deployContract = () => {
    return deployBaseContract(deployContractFunction, contractName);
  };

  const baseContractDeployment$ = defer(() => deployContract()).pipe(shareReplay());

  const baseContractDeploymentReceipt$ = waitForReceipt<DeploymentEventContract>(
    baseContractDeployment$
  ).pipe(shareReplay());

  return baseContractDeploymentReceipt$;
}
