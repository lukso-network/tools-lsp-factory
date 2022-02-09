import { NonceManager } from '@ethersproject/experimental';
import { concat, concatAll, defaultIfEmpty, EMPTY, from, of, shareReplay, switchMap } from 'rxjs';

import versions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION, NULL_ADDRESS } from '../helpers/config.helper';
import { getDeployedByteCode } from '../helpers/deployment.helper';
import { DeploymentEventContract, LSPFactoryOptions } from '../interfaces';
import {
  ContractDeploymentOptions,
  DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';
import {
  lsp8BaseContractDeployment$,
  shouldDeployDigitalAssetBaseContract$,
} from '../services/base-contract.service';
import {
  lsp8IdentifiableDigitalAssetDeployment$,
  waitForContractDeployment$,
} from '../services/digital-asset.service';

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
   * Returns a Promise with deployed contract details or an RxJS Observable of transaction details if `deployReactive` flag is set to true
   *
   * @param {DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Promise<DeployedContracts> | Observable<DigitalAssetDeploymentEvent>
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
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    const defaultBaseContractAddress: string | undefined =
      contractDeploymentOptions?.libAddress ??
      versions[this.options.chainId]?.contracts.LSP8Mintable?.versions[DEFAULT_CONTRACT_VERSION];

    const shouldDeployBaseContract$ = shouldDeployDigitalAssetBaseContract$(
      this.options.provider,
      defaultBaseContractAddress,
      contractDeploymentOptions
    );

    const baseContractDeployment$ = shouldDeployBaseContract$.pipe(
      switchMap((shouldDeployBaseContract) => {
        return shouldDeployBaseContract ? lsp8BaseContractDeployment$(this.options.signer) : EMPTY;
      }),
      shareReplay()
    );

    const baseContractAddress$ = baseContractDeployment$.pipe(
      switchMap((deploymentEvent: DeploymentEventContract) => {
        if (deploymentEvent.receipt?.contractAddress) {
          return of(deploymentEvent.receipt.contractAddress);
        }
        return '';
      }),
      defaultIfEmpty(
        (function () {
          if (contractDeploymentOptions?.deployProxy === false) return null;
          return defaultBaseContractAddress;
        })()
      )
    );

    const digitalAsset$ = lsp8IdentifiableDigitalAssetDeployment$(
      this.signer,
      digitalAssetDeploymentOptions,
      baseContractAddress$
    );

    const deployment$ = concat([baseContractDeployment$, digitalAsset$]).pipe(concatAll());

    if (contractDeploymentOptions?.deployReactive) return deployment$;

    return waitForContractDeployment$(deployment$);
  }
}
