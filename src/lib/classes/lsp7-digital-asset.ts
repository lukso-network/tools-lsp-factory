import { NonceManager } from '@ethersproject/experimental';
import { lastValueFrom, scan } from 'rxjs';

import versions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import { DeploymentEvent, LSPFactoryOptions } from '../interfaces';
import {
  ContractDeploymentOptions,
  DeployedContracts,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';
import { lsp7DigitalAssetDeployment$ } from '../services/digital-asset.service';

/**
 * Class responsible for deploying LSP7 Digital Assets
 *
 * @property {LSPFactoryOptions} options
 * @property {NonceManager} signer
 * @memberof LSPFactory
 */
export class LSP7DigitalAsset {
  options: LSPFactoryOptions;
  signer: NonceManager;
  constructor(options: LSPFactoryOptions) {
    this.options = options;
    this.signer = new NonceManager(options.signer);
  }

  /**
   * Deploys a mintable LSP7 Digital Asset
   *
   * @param {LSP7DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*} Returns an rxjs Observable which emits events as contracts are deployed
   * @memberof LSP7DigitalAsset
   */
  deployReactive(
    digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    const digitalAsset$ = lsp7DigitalAssetDeployment$(
      this.signer,
      digitalAssetDeploymentOptions,
      contractDeploymentOptions?.libAddress ??
        versions[this.options.chainId]?.baseContracts?.LSP7Mintable[DEFAULT_CONTRACT_VERSION]
    );
    return digitalAsset$;
  }

  /**
   * Deploys a mintable LSP7 Digital Asset
   *
   * Asyncronous version of `deployReactive`. Returns a Promise with deployed contract details
   *
   * @param {LSP7DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Promise<DeployedContracts>
   * @memberof LSP7DigitalAsset
   *
   * @example
   * ```javascript
   *lspFactory.LSP7DigitalAsset.deploy({
   *  name: "My token",
   *  symbol: "TKN",
   *  ownerAddress: "0xb74a88C43BCf691bd7A851f6603cb1868f6fc147",
   *  isNFT: true,
   *}) 

   */
  deploy(
    digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    const deployments$ = this.deployReactive(
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
}
