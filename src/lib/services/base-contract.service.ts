import { Signer } from '@ethersproject/abstract-signer';
import { defer, EMPTY, merge, Observable, of } from 'rxjs';
import { defaultIfEmpty, shareReplay, switchMap, tap } from 'rxjs/operators';

import {
  ContractDeploymentOptions,
  ContractNames,
  DeploymentEventContract,
  UniversalProfileInit__factory,
  UniversalReceiverDelegateInit__factory,
} from '../..';
import { deployBaseContract, waitForReceipt } from '../helpers/deployment.helper';

export function baseContractsDeployment$(
  signer: Signer,
  baseContractsToDeploy$: Observable<[boolean, boolean]>
): Observable<DeploymentEventContract> {
  const erc725AccountBaseContractDeploymentReceipt$ = deployBaseContract$(
    ContractNames.ERC725_Account,
    () => {
      return new UniversalProfileInit__factory(signer).deploy();
    }
  );

  const universalReceiverBaseContractDeploymentReceipt$ = deployBaseContract$(
    ContractNames.UNIVERSAL_RECEIVER,
    () => {
      return new UniversalReceiverDelegateInit__factory(signer).deploy();
    }
  );

  const baseContractDeployment$ = baseContractsToDeploy$.pipe(
    switchMap(([shouldDeployUPBaseContract, shouldDeployUniversalReceiverBaseContract]) => {
      return merge(
        shouldDeployUPBaseContract ? erc725AccountBaseContractDeploymentReceipt$ : EMPTY,
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
  defaultUPBaseContractAddress: string,
  defaultUniversalReceiverBaseContractAddress: string,
  defaultBaseContractByteCode$: Observable<[string, string]>,
  signer: Signer,
  contractDeploymentOptions?: ContractDeploymentOptions
) {
  const providedUPBaseContractAddress = contractDeploymentOptions?.libAddresses?.erc725AccountInit;
  const providedUniversalReceiverContractAddress =
    contractDeploymentOptions?.libAddresses?.universalReceiverDelegateInit;

  const baseContractsToDeploy$ = defaultBaseContractByteCode$.pipe(
    switchMap(([defaultUPBaseContractByteCode, defaultUniversalReceiverBaseContractByteCode]) => {
      const shouldDeployUPBaseContract =
        !providedUPBaseContractAddress && defaultUPBaseContractByteCode === '0x';

      const shouldDeployUniversalReceiverBaseContract =
        !providedUniversalReceiverContractAddress &&
        defaultUniversalReceiverBaseContractByteCode === '0x';

      return of([shouldDeployUPBaseContract, shouldDeployUniversalReceiverBaseContract]);
    })
  );

  const baseContracts$ = baseContractsDeployment$(
    signer,
    baseContractsToDeploy$ as Observable<[boolean, boolean]>
  );

  const baseContractAddresses = {
    [ContractNames.ERC725_Account]: providedUPBaseContractAddress ?? defaultUPBaseContractAddress,
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
