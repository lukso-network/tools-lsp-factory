import { NonceManager } from '@ethersproject/experimental';
import { lastValueFrom, scan } from 'rxjs';

import versions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import { DeploymentEvent, LSPFactoryOptions } from '../interfaces';
import {
  ContractDeploymentOptions,
  DeployedContracts,
  DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';
import { lsp8IdentifiableDigitalAssetDeployment$ } from '../services/digital-asset.service';

/**
 * Class responsible for deploying LSP8 Identifiable Digital Assets
 *
 * @property {LSPFactoryOptions} options
 * @property {NonceManager} signer
 * @memberof LSPFactory
 */
export class LSP8IdentifiableDigitalAsset {
  options: LSPFactoryOptions;
  signer: NonceManager;
  constructor(options: LSPFactoryOptions) {
    this.options = options;
    this.signer = new NonceManager(options.signer);
  }

  /**
   * Deploys a mintable LSP8 Identifiable Digital Asset
   *
   * @param {DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Returns an rxjs Observable which emits events as contracts are deployed
   * @memberof LSP8IdentifiableDigitalAsset
   */
  deployReactive(
    digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    const digitalAsset$ = lsp8IdentifiableDigitalAssetDeployment$(
      this.signer,
      digitalAssetDeploymentOptions,
      contractDeploymentOptions?.libAddress ??
        versions[this.options.chainId]?.baseContracts?.LSP8Mintable[DEFAULT_CONTRACT_VERSION]
    );

    return digitalAsset$;
  }

  /**
   * Deploys a mintable LSP8 Identifiable Digital Asset
   *
   * Asyncronous version of `deployLSP8IdentifiableDigitalAssetReactive`.
   *
   * @param {DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Returns a Promise with deployed contract details
   * @memberof LSP8IdentifiableDigitalAsset
   *
   * @example
   * ```javascript
   *lspFactory.LSP8IdentifiableDigitalAsset.deploy({
   *  name: "My token",
   *  symbol: "TKN",
   *  ownerAddress: "0xb74a88C43BCf691bd7A851f6603cb1868f6fc147",
   *})
   *```
   */
  deploy(
    digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
    ContractDeploymentOptions?: ContractDeploymentOptions
  ) {
    const deployments$ = this.deployReactive(
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
}
