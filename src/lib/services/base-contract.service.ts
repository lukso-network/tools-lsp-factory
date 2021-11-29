import { Signer } from '@ethersproject/abstract-signer';
import { defer, EMPTY, merge, Observable, of } from 'rxjs';
import { defaultIfEmpty, shareReplay, switchMap, tap } from 'rxjs/operators';

import {
  ContractDeploymentOptions,
  DeploymentEventContract,
  LSP1UniversalReceiverDelegateInit__factory,
  LSP7MintableInit__factory,
  LSP8MintableInit__factory,
  ContractNames as UniversalProfileContractNames,
  UniversalProfileInit__factory,
} from '../..';
import { GAS_PRICE, NULL_ADDRESS } from '../helpers/config.helper';
import { deployBaseContract, waitForReceipt } from '../helpers/deployment.helper';
import { ContractNames as DigitalAssetContractNames } from '../interfaces/digital-asset-deployment';

export function universalProfileBaseContractsDeployment$(
  signer: Signer,
  baseContractsToDeploy$: Observable<[boolean, boolean]>
): Observable<DeploymentEventContract> {
  const erc725AccountBaseContractDeploymentReceipt$ = deployBaseContract$(
    UniversalProfileContractNames.ERC725_Account,
    async () => {
      const universalProfileInit = await new UniversalProfileInit__factory(signer).deploy({
        gasPrice: GAS_PRICE,
      });
      await universalProfileInit.initialize(NULL_ADDRESS);
      return universalProfileInit;
    }
  );

  const universalReceiverBaseContractDeploymentReceipt$ = deployBaseContract$(
    UniversalProfileContractNames.UNIVERSAL_RECEIVER,
    () => {
      return new LSP1UniversalReceiverDelegateInit__factory(signer).deploy({ gasPrice: GAS_PRICE });
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

export function digitalAssetBaseContractsDeployment$(
  signer: Signer,
  baseContractsToDeploy$: Observable<[boolean, boolean]>
): Observable<DeploymentEventContract> {
  const lsp7DigitalAssetBaseContractReceipt$ = deployBaseContract$(
    DigitalAssetContractNames.LSP7_DIGITAL_ASSET,
    async () => {
      const lsp7Init = await new LSP7MintableInit__factory(signer).deploy({
        gasPrice: GAS_PRICE,
      });
      await lsp7Init['initialize(address)'](NULL_ADDRESS);
      return lsp7Init;
    }
  );

  const lsp8IdentifiableDigitalAssetReceipt$ = deployBaseContract$(
    DigitalAssetContractNames.LSP8_DIGITAL_ASSET,
    async () => {
      const lsp8Init = await new LSP8MintableInit__factory(signer).deploy({
        gasPrice: GAS_PRICE,
      });
      await lsp8Init['initialize(address)'](NULL_ADDRESS);
      return lsp8Init;
    }
  );

  const baseContractDeployment$ = baseContractsToDeploy$.pipe(
    switchMap(([shouldDeployLSP7, shouldDeployLSP8]) => {
      return merge(
        shouldDeployLSP7 ? lsp7DigitalAssetBaseContractReceipt$ : EMPTY,
        shouldDeployLSP8 ? lsp8IdentifiableDigitalAssetReceipt$ : EMPTY
      );
    }),
    shareReplay()
  );

  return baseContractDeployment$;
}

function deployBaseContract$(
  contractName: UniversalProfileContractNames | DigitalAssetContractNames,
  deployContractFunction
) {
  const deployContract = () => {
    return deployBaseContract(deployContractFunction, contractName);
  };

  const baseContractDeployment$ = defer(() => deployContract()).pipe(shareReplay());

  const baseContractDeploymentReceipt$ = waitForReceipt<DeploymentEventContract>(
    baseContractDeployment$
  ).pipe(shareReplay());

  return baseContractDeploymentReceipt$;
}

export function getUniversalProfileBaseContractAddresses$(
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

  const baseContracts$ = universalProfileBaseContractsDeployment$(
    signer,
    baseContractsToDeploy$ as Observable<[boolean, boolean]>
  );

  const baseContractAddresses = {
    [UniversalProfileContractNames.ERC725_Account]:
      providedUPBaseContractAddress ?? defaultUPBaseContractAddress,
    [UniversalProfileContractNames.UNIVERSAL_RECEIVER]:
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
