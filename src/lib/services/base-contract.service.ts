import { Signer } from '@ethersproject/abstract-signer';
import { providers } from 'ethers';
import { defer, EMPTY, forkJoin, from, merge, Observable, of } from 'rxjs';
import { defaultIfEmpty, last, shareReplay, switchMap, tap } from 'rxjs/operators';

import {
  BaseContractAddresses,
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

export function shouldDeployBaseContract$(
  provider: providers.Web3Provider | providers.JsonRpcProvider,
  deployProxy: boolean,
  defaultBaseContractAddress?: string,
  providedBaseContractAddress?: string
) {
  const defaultBaseContractBytecode$ = from(
    getDeployedByteCode(defaultBaseContractAddress ?? NULL_ADDRESS, provider)
  );

  return defaultBaseContractBytecode$.pipe(
    switchMap((defultBaseContractBytecode) => {
      return of(!providedBaseContractAddress && deployProxy && defultBaseContractBytecode === '0x');
    }),
    shareReplay()
  );
}

export function shouldDeployUniversalProfileBaseContracts$(
  defaultUPBaseContractAddress: string,
  defaultUniversalReceiverBaseContractAddress: string,
  defaultKeyManagerBaseContractAddress: string,
  provider: providers.Web3Provider | providers.JsonRpcProvider,
  contractDeploymentOptions?: ProfileContractDeploymentOptions
) {
  const deployERC725AccountProxy = contractDeploymentOptions?.ERC725Account?.deployProxy !== false;
  const deployUniversalReceiverProxy =
    contractDeploymentOptions?.UniversalReceiverDelegate?.deployProxy !== false;
  const deployKeyManagerProxy = contractDeploymentOptions?.KeyManager?.deployProxy !== false;

  return forkJoin([
    shouldDeployBaseContract$(
      provider,
      deployERC725AccountProxy,
      defaultUPBaseContractAddress,
      contractDeploymentOptions?.ERC725Account?.libAddress
    ),
    shouldDeployBaseContract$(
      provider,
      deployUniversalReceiverProxy,
      defaultUniversalReceiverBaseContractAddress,
      contractDeploymentOptions?.UniversalReceiverDelegate?.libAddress
    ),
    shouldDeployBaseContract$(
      provider,
      deployKeyManagerProxy,
      defaultKeyManagerBaseContractAddress,
      contractDeploymentOptions?.KeyManager?.libAddress
    ),
  ]).pipe(shareReplay());
}

export function universalProfileBaseContractAddresses$(
  baseContractDeployment$: Observable<DeploymentEventContract>,
  defaultUPBaseContractAddress: string,
  defaultUniversalReceiverBaseContractAddress: string,
  defaultKeyManagerBaseContractAddress: string,
  contractDeploymentOptions?: ProfileContractDeploymentOptions
) {
  const providedUPBaseContractAddress = contractDeploymentOptions?.ERC725Account?.libAddress;
  const providedUniversalReceiverContractAddress =
    contractDeploymentOptions?.UniversalReceiverDelegate?.libAddress;
  const providedKeyManagerContractAddress = contractDeploymentOptions?.KeyManager?.libAddress;

  const baseContractAddresses: BaseContractAddresses = {
    [UniversalProfileContractNames.ERC725_Account]:
      providedUPBaseContractAddress ??
      contractDeploymentOptions?.ERC725Account?.deployProxy !== false
        ? defaultUPBaseContractAddress
        : null,
    [UniversalProfileContractNames.UNIVERSAL_RECEIVER]:
      providedUniversalReceiverContractAddress ??
      contractDeploymentOptions?.UniversalReceiverDelegate?.deployProxy !== false
        ? defaultUniversalReceiverBaseContractAddress
        : null,
    [UniversalProfileContractNames.KEY_MANAGER]:
      providedKeyManagerContractAddress ??
      contractDeploymentOptions?.KeyManager?.deployProxy !== false
        ? defaultKeyManagerBaseContractAddress
        : null,
  };

  return baseContractDeployment$.pipe(
    tap((deploymentEvent: DeploymentEventContract) => {
      baseContractAddresses[deploymentEvent.contractName] = deploymentEvent.receipt.contractAddress;
    }),
    defaultIfEmpty(of(baseContractAddresses)),
    last(),
    switchMap(() => of(baseContractAddresses)),
    shareReplay()
  );
}

export function waitForBaseContractAddress$(
  baseContractDeployment$: Observable<DeploymentEventContract>,
  defaultBaseContractAddress: string,
  deployProxy: boolean
) {
  return baseContractDeployment$.pipe(
    switchMap((deploymentEvent: DeploymentEventContract) => {
      if (deploymentEvent.receipt?.contractAddress) {
        return of(deploymentEvent.receipt.contractAddress);
      }
      return '';
    }),
    defaultIfEmpty(
      (function () {
        if (!deployProxy) return null;
        return defaultBaseContractAddress;
      })()
    )
  );
}
