import { Signer } from '@ethersproject/abstract-signer';
import { providers } from 'ethers';
import { defer, EMPTY, from, merge, Observable, of } from 'rxjs';
import { defaultIfEmpty, shareReplay, switchMap, tap } from 'rxjs/operators';

import {
  DeploymentEventContract,
  LSP1UniversalReceiverDelegateInit__factory,
  LSP6KeyManagerInit__factory,
  LSP7MintableInit__factory,
  LSP8MintableInit__factory,
  ContractDeploymentOptions as ProfileContractDeploymentOptions,
  ContractNames as UniversalProfileContractNames,
  UniversalProfileInit__factory,
} from '../..';
import { GAS_PRICE, NULL_ADDRESS } from '../helpers/config.helper';
import {
  deployBaseContract,
  getDeployedByteCode,
  waitForReceipt,
} from '../helpers/deployment.helper';
import { ContractNames as DigitalAssetContractNames } from '../interfaces/digital-asset-deployment';
import { ContractDeploymentOptions as DigitalAssetContractDeploymentOptions } from '../interfaces/digital-asset-deployment';

export function universalProfileBaseContractsDeployment$(
  signer: Signer,
  baseContractsToDeploy$: Observable<[boolean, boolean, boolean]>
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

  const keyManagerBaseContractDeploymentReceipt$ = deployBaseContract$(
    UniversalProfileContractNames.KEY_MANAGER,
    async () => {
      const keyManagerInit = await new LSP6KeyManagerInit__factory(signer).deploy({
        gasPrice: GAS_PRICE,
      });
      await keyManagerInit.initialize(NULL_ADDRESS);
      return keyManagerInit;
    }
  );

  const baseContractDeployment$ = baseContractsToDeploy$.pipe(
    switchMap(
      ([
        shouldDeployUPBaseContract,
        shouldDeployUniversalReceiverBaseContract,
        shouldDeployKeyManagerBaseContract,
      ]) => {
        return merge(
          shouldDeployUPBaseContract ? erc725AccountBaseContractDeploymentReceipt$ : EMPTY,
          shouldDeployUniversalReceiverBaseContract
            ? universalReceiverBaseContractDeploymentReceipt$
            : EMPTY,
          shouldDeployKeyManagerBaseContract ? keyManagerBaseContractDeploymentReceipt$ : EMPTY
        );
      }
    ),
    shareReplay()
  );

  return baseContractDeployment$;
}

export function lsp7BaseContractDeployment$(signer: Signer) {
  return deployBaseContract$(DigitalAssetContractNames.LSP7_DIGITAL_ASSET, async () => {
    const lsp7Init = await new LSP7MintableInit__factory(signer).deploy({
      gasPrice: GAS_PRICE,
    });
    await lsp7Init['initialize(address)'](NULL_ADDRESS);
    return lsp7Init;
  });
}

export function lsp8BaseContractDeployment$(signer: Signer) {
  return deployBaseContract$(DigitalAssetContractNames.LSP8_DIGITAL_ASSET, async () => {
    const lsp8Init = await new LSP8MintableInit__factory(signer).deploy({
      gasPrice: GAS_PRICE,
    });
    await lsp8Init['initialize(address)'](NULL_ADDRESS);
    return lsp8Init;
  });
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

export function shouldDeployDigitalAssetBaseContract$(
  provider: providers.Web3Provider | providers.JsonRpcProvider,
  defaultBaseContractAddress?: string,
  contractDeploymentOptions?: DigitalAssetContractDeploymentOptions
) {
  const defaultBaseContractBytecode$ = from(
    getDeployedByteCode(defaultBaseContractAddress ?? NULL_ADDRESS, provider)
  );

  const providedBaseContractAddress = contractDeploymentOptions?.libAddress;

  return defaultBaseContractBytecode$.pipe(
    switchMap((defultBaseContractBytecode) => {
      return of(
        !providedBaseContractAddress &&
          contractDeploymentOptions?.deployProxy !== false &&
          defultBaseContractBytecode === '0x'
      );
    }),
    shareReplay()
  );
}

export function getUniversalProfileBaseContractAddresses$(
  defaultUPBaseContractAddress: string,
  defaultUniversalReceiverBaseContractAddress: string,
  defaultKeyManagerBaseContractAddress: string,
  defaultBaseContractByteCode$: Observable<[string, string, string]>,
  signer: Signer,
  contractDeploymentOptions?: ProfileContractDeploymentOptions
) {
  const providedUPBaseContractAddress = contractDeploymentOptions?.libAddresses?.erc725AccountInit;
  const providedUniversalReceiverContractAddress =
    contractDeploymentOptions?.libAddresses?.universalReceiverDelegateInit;
  const providedKeyManagerContractAddress = contractDeploymentOptions?.libAddresses?.keyManagerInit;

  const baseContractsToDeploy$ = defaultBaseContractByteCode$.pipe(
    switchMap(
      ([
        defaultUPBaseContractByteCode,
        defaultUniversalReceiverBaseContractByteCode,
        defaultkeyManagerBaseContractByteCode,
      ]) => {
        const shouldDeployUPBaseContract =
          !providedUPBaseContractAddress && defaultUPBaseContractByteCode === '0x';

        const shouldDeployUniversalReceiverBaseContract =
          !providedUniversalReceiverContractAddress &&
          defaultUniversalReceiverBaseContractByteCode === '0x';

        const shouldDeployKeyManagerBaseContract =
          !providedKeyManagerContractAddress && defaultkeyManagerBaseContractByteCode === '0x';

        return of([
          shouldDeployUPBaseContract,
          shouldDeployUniversalReceiverBaseContract,
          shouldDeployKeyManagerBaseContract,
        ]);
      }
    )
  );

  const baseContracts$ = universalProfileBaseContractsDeployment$(
    signer,
    baseContractsToDeploy$ as Observable<[boolean, boolean, boolean]>
  );

  const baseContractAddresses = {
    [UniversalProfileContractNames.ERC725_Account]:
      providedUPBaseContractAddress ?? defaultUPBaseContractAddress,
    [UniversalProfileContractNames.UNIVERSAL_RECEIVER]:
      providedUniversalReceiverContractAddress ?? defaultUniversalReceiverBaseContractAddress,
    [UniversalProfileContractNames.KEY_MANAGER]:
      providedKeyManagerContractAddress ?? defaultKeyManagerBaseContractAddress,
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
