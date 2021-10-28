import { Signer } from '@ethersproject/abstract-signer';
import { defer, EMPTY, merge, Observable, of } from 'rxjs';
import { defaultIfEmpty, shareReplay, switchMap, tap } from 'rxjs/operators';

import { ContractDeploymentOptions, ContractNames, DeploymentEventContract } from '../..';
import { LSP3AccountInit__factory } from '../../tmp/Factories/LSP3AccountInit__factory';
import { UniversalReceiverAddressStoreInit__factory } from '../../tmp/Factories/UniversalReceiverAddressStoreInit__factory';
import { deployBaseContract, waitForReceipt } from '../helpers/deployment.helper';

export function baseContractsDeployment$(
  signer: Signer,
  baseContractsToDeploy$: Observable<[boolean, boolean]>
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

  const baseContractDeployment$ = baseContractsToDeploy$.pipe(
    switchMap(([shouldDeployLSP3BaseContract, shouldDeployUniversalReceiverBaseContract]) => {
      return merge(
        shouldDeployLSP3BaseContract ? lsp3AccountBaseContractDeploymentReceipt$ : EMPTY,
        shouldDeployUniversalReceiverBaseContract
          ? universalReceiverBaseContractDeploymentReceipt$
          : EMPTY
      );
    }),
    shareReplay()
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

export function getBaseContractAddresses$(
  defaultLSP3BaseContractAddress: string,
  defaultUniversalReceiverBaseContractAddress: string,
  defaultBaseContractByteCode$: Observable<[string, string]>,
  signer: Signer,
  contractDeploymentOptions?: ContractDeploymentOptions
) {
  const providedLSP3BaseContractAddress = contractDeploymentOptions?.libAddresses?.lsp3AccountInit;
  const providedUniversalReceiverContractAddress =
    contractDeploymentOptions?.libAddresses?.universalReceiverAddressStoreInit;

  const baseContractsToDeploy$ = defaultBaseContractByteCode$.pipe(
    switchMap(([defaultLSP3BaseContractByteCode, defaultUniversalReceiverBaseContractByteCode]) => {
      const shouldDeployLSP3BaseContract =
        !providedLSP3BaseContractAddress && defaultLSP3BaseContractByteCode === '0x';

      const shouldDeployUniversalReceiverBaseContract =
        !providedUniversalReceiverContractAddress &&
        defaultUniversalReceiverBaseContractByteCode === '0x';

      return of([shouldDeployLSP3BaseContract, shouldDeployUniversalReceiverBaseContract]);
    })
  );

  const baseContracts$ = baseContractsDeployment$(
    signer,
    baseContractsToDeploy$ as Observable<[boolean, boolean]>
  );

  const baseContractAddresses = {
    [ContractNames.LSP3_ACCOUNT]: providedLSP3BaseContractAddress ?? defaultLSP3BaseContractAddress,
    [ContractNames.UNIVERSAL_RECEIVER]:
      providedUniversalReceiverContractAddress ?? defaultUniversalReceiverBaseContractAddress,
  };

  const baseContractAddresses$ = baseContracts$.pipe(
    tap((deploymentEvent: DeploymentEventContract) => {
      baseContractAddresses[deploymentEvent.contractName] = deploymentEvent.receipt.contractAddress;
    }),
    defaultIfEmpty(of(baseContractAddresses)),
    switchMap(() => of(baseContractAddresses)),
    shareReplay()
  );

  return baseContractAddresses$;
}
