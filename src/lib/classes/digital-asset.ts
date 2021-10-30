import { NonceManager } from '@ethersproject/experimental';
import { lastValueFrom, scan } from 'rxjs';

import { DeploymentEvent, LSPFactoryOptions } from '../interfaces';
import {
  DeployedContracts,
  DigitalAssetDeploymentOptions,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';
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

  deployLSP7DigitalAssetReactive(digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions) {
    const digitalAsset$ = lsp7DigitalAssetDeployment$(this.signer, digitalAssetDeploymentOptions);

    return digitalAsset$;
  }

  deployLSP7DigitalAsset(digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions) {
    const deployments$ = this.deployLSP7DigitalAssetReactive(digitalAssetDeploymentOptions).pipe(
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

  deployLSP8IdentifiableDigitalAssetReactive(
    digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions
  ) {
    const digitalAsset$ = lsp8IdentifiableDigitalAssetDeployment$(
      this.signer,
      digitalAssetDeploymentOptions
    );

    return digitalAsset$;
  }

  deployLSP8IdentifiableDigitalAsset(digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions) {
    const deployments$ = this.deployLSP8IdentifiableDigitalAssetReactive(
      digitalAssetDeploymentOptions
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
}