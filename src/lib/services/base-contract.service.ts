import { Signer } from '@ethersproject/abstract-signer';
import { constants as ethersConstants, providers } from 'ethers';
import { defer, EMPTY, forkJoin, from, merge, Observable, of } from 'rxjs';
import { defaultIfEmpty, last, shareReplay, switchMap, tap } from 'rxjs/operators';

import {
  BaseContractAddresses,
  DeploymentEventContract,
  LSP1UniversalReceiverDelegateUP__factory,
  LSP6KeyManagerInit__factory,
  LSP7MintableInit__factory,
  LSP8MintableInit__factory,
  ContractNames as UniversalProfileContractNames,
  UniversalProfileDeploymentConfiguration,
  UniversalProfileInit__factory,
} from '../..';
import contractVersions from '../../versions.json';
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
      return universalProfileInit;
    }
  );

  const universalReceiverBaseContractDeploymentReceipt$ = deployBaseContract$(
    UniversalProfileContractNames.UNIVERSAL_RECEIVER,
    () => {
      return new LSP1UniversalReceiverDelegateUP__factory(signer).deploy({
        gasPrice: GAS_PRICE,
      });
    }
  );

  const keyManagerBaseContractDeploymentReceipt$ = deployBaseContract$(
    UniversalProfileContractNames.KEY_MANAGER,
    async () => {
      const keyManagerInit = await new LSP6KeyManagerInit__factory(signer).deploy({
        gasPrice: GAS_PRICE,
      });
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

    return lsp7Init;
  });
}

export function lsp8BaseContractDeployment$(signer: Signer) {
  return deployBaseContract$(DigitalAssetContractNames.LSP8_DIGITAL_ASSET, async () => {
    const lsp8Init = await new LSP8MintableInit__factory(signer).deploy({
      gasPrice: GAS_PRICE,
    });

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
  defaultDeployProxy?: boolean,
  providedDeployProxy?: boolean,
  defaultBaseContractAddress?: string,
  providedBaseContractAddress?: string,
  providedByteCode?: string
) {
  const defaultBaseContractBytecode$ = from(
    getDeployedByteCode(defaultBaseContractAddress ?? NULL_ADDRESS, provider)
  );

  const deployProxy =
    typeof providedDeployProxy !== 'undefined' ? providedDeployProxy : defaultDeployProxy;

  return defaultBaseContractBytecode$.pipe(
    switchMap((defaultBaseContractBytecode) => {
      return of(
        (function () {
          if (deployProxy === false || providedBaseContractAddress || providedByteCode)
            return false;

          return defaultBaseContractBytecode === '0x';
        })()
      );
    }),
    shareReplay()
  );
}

export function shouldDeployUniversalProfileBaseContracts$(
  defaultUPBaseContractAddress: string,
  defaultUniversalReceiverBaseContractAddress: string,
  defaultKeyManagerBaseContractAddress: string,
  provider: providers.Web3Provider | providers.JsonRpcProvider,
  chainId: number,
  contractDeploymentOptions?: UniversalProfileDeploymentConfiguration
) {
  return forkJoin([
    shouldDeployBaseContract$(
      provider,
      contractVersions[chainId]?.contracts?.ERC725Account?.baseContract,
      contractDeploymentOptions?.LSP0ERC725Account?.deployProxy,
      defaultUPBaseContractAddress,
      contractDeploymentOptions?.LSP0ERC725Account?.libAddress,
      contractDeploymentOptions?.LSP0ERC725Account?.byteCode
    ),
    shouldDeployBaseContract$(
      provider,
      contractVersions[chainId]?.contracts?.UniversalReceiverDelegate?.baseContract,
      contractDeploymentOptions?.LSP1UniversalReceiverDelegate?.deployProxy,
      defaultUniversalReceiverBaseContractAddress,
      contractDeploymentOptions?.LSP1UniversalReceiverDelegate?.libAddress,
      contractDeploymentOptions?.LSP1UniversalReceiverDelegate?.byteCode
    ),
    shouldDeployBaseContract$(
      provider,
      contractVersions[chainId]?.contracts?.KeyManager?.baseContract,
      contractDeploymentOptions?.LSP6KeyManager?.deployProxy,
      defaultKeyManagerBaseContractAddress,
      contractDeploymentOptions?.LSP6KeyManager?.libAddress,
      contractDeploymentOptions?.LSP6KeyManager?.byteCode
    ),
  ]).pipe(shareReplay());
}

export function universalProfileBaseContractAddresses$(
  baseContractDeployment$: Observable<DeploymentEventContract>,
  defaultUPBaseContractAddress: string,
  defaultKeyManagerBaseContractAddress: string,
  contractDeploymentOptions?: UniversalProfileDeploymentConfiguration,
  deployUniversalReceiverProxy?: boolean
) {
  const providedUPBaseContractAddress = contractDeploymentOptions?.LSP0ERC725Account?.libAddress;
  const providedUniversalReceiverContractAddress =
    contractDeploymentOptions?.LSP1UniversalReceiverDelegate?.libAddress;
  const providedKeyManagerContractAddress = contractDeploymentOptions?.LSP6KeyManager?.libAddress;

  const baseContractAddresses: BaseContractAddresses = {
    [UniversalProfileContractNames.ERC725_Account]:
      providedUPBaseContractAddress ??
      (contractDeploymentOptions?.LSP0ERC725Account?.deployProxy !== false &&
        !contractDeploymentOptions?.LSP0ERC725Account?.byteCode)
        ? defaultUPBaseContractAddress
        : null,
    [UniversalProfileContractNames.UNIVERSAL_RECEIVER]:
      deployUniversalReceiverProxy && providedUniversalReceiverContractAddress
        ? providedUniversalReceiverContractAddress
        : null,
    [UniversalProfileContractNames.KEY_MANAGER]:
      providedKeyManagerContractAddress ??
      (contractDeploymentOptions?.LSP6KeyManager?.deployProxy !== false &&
        !contractDeploymentOptions?.LSP6KeyManager?.byteCode)
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
  deployProxy?: boolean,
  providedByteCode?: string
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
        if (deployProxy === false || providedByteCode) return null;
        return defaultBaseContractAddress;
      })()
    )
  );
}
