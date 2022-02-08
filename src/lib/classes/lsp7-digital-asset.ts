import { NonceManager } from '@ethersproject/experimental';
import {
  concat,
  concatAll,
  defaultIfEmpty,
  EMPTY,
  from,
  lastValueFrom,
  of,
  scan,
  shareReplay,
  switchMap,
} from 'rxjs';

import versions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION, NULL_ADDRESS } from '../helpers/config.helper';
import { getDeployedByteCode } from '../helpers/deployment.helper';
import {
  DeploymentEvent,
  DeploymentEventContract,
  DeploymentType,
  LSPFactoryOptions,
} from '../interfaces';
import {
  ContractDeploymentOptions,
  DeployedContracts,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';
import {
  lsp7BaseContractDeployment$,
  shouldDeployLSP7BaseContract$,
} from '../services/base-contract.service';
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
   * Returns a Promise with deployed contract details or an RxJS Observable of transaction details if `deployReactive` flag is set to true
   *
   * @param {LSP7DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Promise<DeployedContracts> | Observable<DigitalAssetDeploymentEvent>
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
   *```
   */
  deploy(
    digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    const defaultBaseContractAddress: string =
      contractDeploymentOptions?.libAddress ??
      versions[this.options.chainId]?.contracts.LSP7Mintable?.versions[DEFAULT_CONTRACT_VERSION];

    const defaultBaseContractByteCode$ = from(
      getDeployedByteCode(defaultBaseContractAddress ?? NULL_ADDRESS, this.options.provider)
    );

    const shouldDeployBaseContract$ = shouldDeployLSP7BaseContract$(
      defaultBaseContractByteCode$,
      contractDeploymentOptions
    );

    const baseContractDeployment$ = shouldDeployBaseContract$.pipe(
      switchMap((shouldDeployBaseContract) => {
        return shouldDeployBaseContract ? lsp7BaseContractDeployment$(this.options.signer) : EMPTY;
      }),
      shareReplay()
    );

    const baseContractAddress$ = baseContractDeployment$.pipe(
      switchMap((deploymentEvent: DeploymentEventContract) => {
        if (deploymentEvent.receipt?.contractAddress) {
          return of(deploymentEvent.receipt.contractAddress);
        }

        return of('');
      }),
      defaultIfEmpty(
        (function () {
          if (contractDeploymentOptions?.deployProxy === false) return null;
          return defaultBaseContractAddress;
        })()
      )
    );

    const digitalAsset$ = lsp7DigitalAssetDeployment$(
      this.signer,
      digitalAssetDeploymentOptions,
      baseContractAddress$
    );

    const deployment$ = concat([baseContractDeployment$, digitalAsset$]).pipe(concatAll());

    if (contractDeploymentOptions?.deployReactive) return deployment$;

    return lastValueFrom(
      deployment$.pipe(
        scan((accumulator: DeployedContracts, deploymentEvent: DeploymentEvent) => {
          if (!deploymentEvent.receipt || !deploymentEvent.receipt.contractAddress) {
            return accumulator;
          }

          if (deploymentEvent.type === DeploymentType.BASE_CONTRACT) {
            accumulator[`${deploymentEvent.contractName}BaseContract`] = {
              address: deploymentEvent.receipt.contractAddress,
              receipt: deploymentEvent.receipt,
              type: deploymentEvent.type,
            };
          } else {
            accumulator[deploymentEvent.contractName] = {
              address: deploymentEvent.receipt.contractAddress,
              receipt: deploymentEvent.receipt,
              type: deploymentEvent.type,
            };
          }

          return accumulator;
        }, {})
      )
    );
  }
}
