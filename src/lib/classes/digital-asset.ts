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

/**
 * Class responsible for deploying Digital Assets
 *
 * @property {LSPFactoryOptions} options
 * @property {NonceManager} signer
 * @memberof LSPFactory
 */
export class DigitalAsset {
  options: LSPFactoryOptions;
  signer: NonceManager;
  constructor(options: LSPFactoryOptions) {
    this.options = options;
    this.signer = new NonceManager(options.signer);
  }

  // LSP7

  /**
   * Deploys a mintable LSP7 Digital Asset
   *
   * Returns an Observable which emits events as contracts are deployed
   *
   * @param {LSP7DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Observable<DigitalAssetDeploymentEvent>
   * @memberof DigitalAsset
   */
  deployLSP7DigitalAssetReactive(
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
   * Asyncronous version of `deployLSP7DigitalAssetReactive`. Returns a Promise with deployed contract details
   *
   * @param {LSP7DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Promise<DeployedContracts>
   * @memberof DigitalAsset
   */
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

  /**
   * Deploys a mintable LSP8 Digital Asset
   *
   * Returns an Observable which emits events as contracts are deployed
   *
   * @param {LSP7DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Observable<DigitalAssetDeploymentEvent>
   * @memberof DigitalAsset
   */
  deployLSP8IdentifiableDigitalAssetReactive(
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
   * Deploys a mintable LSP7 Digital Asset
   *
   * Asyncronous version of `deployLSP8IdentifiableDigitalAssetReactive`.
   * Returns a Promise with deployed contract details
   *
   * @param {LSP7DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Promise<DeployedContracts>
   * @memberof DigitalAsset
   */
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

  /**
   * Deploys LSP7 and LSP7 base contracts
   *
   * Returns Promise with base contract details
   *
   * @returns {*}  Promise<DeployedContracts>
   * @memberof LSP3UniversalProfile
   */
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
