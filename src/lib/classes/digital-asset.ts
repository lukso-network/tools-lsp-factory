import { NonceManager } from '@ethersproject/experimental';
import { lastValueFrom, of, scan } from 'rxjs';

import versions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import { DeploymentEvent, LSPFactoryOptions } from '../interfaces';
import {
  ContractDeploymentOptions,
  DeployedContracts,
  DigitalAssetDeploymentOptions,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';
import { digitalAssetBaseContractsDeployment$ } from '../services/base-contract.service';
import {
  lsp7DigitalAssetDeployment$,
  lsp8IdentifiableDigitalAssetDeployment$,
} from '../services/digital-asset.service';

export class DigitalAsset {
  options: LSPFactoryOptions;
  signer: NonceManager;
  constructor(options: LSPFactoryOptions) {
    this.options = options;
    this.signer = new NonceManager(options.signer);
  }

  // LSP7

  deployLSP7DigitalAssetReactive(
    digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    const digitalAsset$ = lsp7DigitalAssetDeployment$(
      this.signer,
      digitalAssetDeploymentOptions,
      contractDeploymentOptions?.libAddress ??
        versions[this.options.chainId]?.baseContracts?.LSP7DigitalAsset[DEFAULT_CONTRACT_VERSION]
    );
    return digitalAsset$;
  }

  deployLSP7DigitalAsset(
    digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    const deployments$ = this.deployLSP7DigitalAssetReactive(
      digitalAssetDeploymentOptions,
      contractDeploymentOptions
    ).pipe(
      scan((accumulator: DeployedContracts, deploymentEvent: DeploymentEvent) => {
        if (deploymentEvent.receipt && deploymentEvent.receipt.contractAddress) {
          accumulator[deploymentEvent.contractName] = {
            address: deploymentEvent.receipt.contractAddress,
            receipt: deploymentEvent.receipt,
          };
        }

        return accumulator;
      }, {})
    );

    return lastValueFrom(deployments$);
  }

  // LSP8

  deployLSP8IdentifiableDigitalAssetReactive(
    digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    const digitalAsset$ = lsp8IdentifiableDigitalAssetDeployment$(
      this.signer,
      digitalAssetDeploymentOptions,
      contractDeploymentOptions?.libAddress ??
        versions[this.options.chainId]?.baseContracts?.LSP8IdentifiableDigitalAsset[
          DEFAULT_CONTRACT_VERSION
        ]
    );

    return digitalAsset$;
  }

  deployLSP8IdentifiableDigitalAsset(
    digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
    ContractDeploymentOptions?: ContractDeploymentOptions
  ) {
    const deployments$ = this.deployLSP8IdentifiableDigitalAssetReactive(
      digitalAssetDeploymentOptions,
      ContractDeploymentOptions
    ).pipe(
      scan((accumulator: DeployedContracts, deploymentEvent: DeploymentEvent) => {
        if (deploymentEvent.receipt && deploymentEvent.receipt.contractAddress) {
          accumulator[deploymentEvent.contractName] = {
            address: deploymentEvent.receipt.contractAddress,
            receipt: deploymentEvent.receipt,
          };
        }

        return accumulator;
      }, {})
    );

    return lastValueFrom(deployments$);
  }

  deployBaseContracts() {
    const baseContractsToDeploy$ = of([true, true] as [boolean, boolean]);

    const baseContracts$ = digitalAssetBaseContractsDeployment$(
      this.signer,
      baseContractsToDeploy$
    );

    const deployments$ = baseContracts$.pipe(
      scan((accumulator: DeployedContracts, deploymentEvent: DeploymentEvent) => {
        if (deploymentEvent.receipt && deploymentEvent.receipt.contractAddress) {
          accumulator[deploymentEvent.contractName] = {
            address: deploymentEvent.receipt.contractAddress,
            receipt: deploymentEvent.receipt,
          };
        }

        return accumulator;
      }, {})
    );

    return lastValueFrom(deployments$);
  }
}
