import { NonceManager } from '@ethersproject/experimental';
import { concat, concatAll, EMPTY, lastValueFrom, Observable, shareReplay, switchMap } from 'rxjs';

import versions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import { deploymentWithContractsOnCompletion$ } from '../helpers/deployment.helper';
import {
  DeploymentEventContract,
  DeploymentEventTransaction,
  LSPFactoryOptions,
} from '../interfaces';
import {
  ContractNames,
  DeployedLSP8IdentifiableDigitalAsset,
  DigitalAssetDeploymentOptions,
  LSP8ContractDeploymentOptionsNonReactive,
  LSP8ContractDeploymentOptionsReactive,
} from '../interfaces/digital-asset-deployment';
import {
  lsp8BaseContractDeployment$,
  shouldDeployBaseContract$,
  waitForBaseContractAddress$,
} from '../services/base-contract.service';
import {
  convertDigitalAssetConfigurationObject,
  lsp4MetadataUpload$,
  lsp8IdentifiableDigitalAssetDeployment$,
  setMetadataAndTransferOwnership$,
} from '../services/digital-asset.service';
import { isSignerUniversalProfile$ } from '../services/lsp3-account.service';

type LSP8ObservableOrPromise<
  T extends LSP8ContractDeploymentOptionsReactive | LSP8ContractDeploymentOptionsNonReactive
> = T extends LSP8ContractDeploymentOptionsReactive
  ? Observable<DeploymentEventContract | DeploymentEventTransaction>
  : Promise<DeployedLSP8IdentifiableDigitalAsset>;

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
  deploy<
    T extends
      | LSP8ContractDeploymentOptionsReactive
      | LSP8ContractDeploymentOptionsNonReactive = LSP8ContractDeploymentOptionsNonReactive
  >(
    digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
    contractDeploymentOptions?: T
  ): LSP8ObservableOrPromise<T> {
    const digitalAssetConfiguration = contractDeploymentOptions
      ? convertDigitalAssetConfigurationObject(contractDeploymentOptions)
      : null;

    const lsp4Metadata$ = lsp4MetadataUpload$(
      digitalAssetDeploymentOptions.digitalAssetMetadata,
      digitalAssetConfiguration?.uploadOptions ?? this.options.uploadOptions
    );

    const defaultBaseContractAddress: string | undefined =
      digitalAssetConfiguration?.libAddress ??
      versions[this.options.chainId]?.contracts.LSP8Mintable?.versions[
        digitalAssetConfiguration?.version ?? DEFAULT_CONTRACT_VERSION
      ];

    const deployBaseContract$ = shouldDeployBaseContract$(
      this.options.provider,
      versions[this.options.chainId]?.contracts.LSP8Mintable?.baseContract,
      digitalAssetConfiguration?.deployProxy,
      defaultBaseContractAddress,
      digitalAssetConfiguration?.libAddress,
      digitalAssetConfiguration?.byteCode
    );

    const baseContractDeployment$ = deployBaseContract$.pipe(
      switchMap((shouldDeployBaseContract) => {
        return shouldDeployBaseContract ? lsp8BaseContractDeployment$(this.options.signer) : EMPTY;
      }),
      shareReplay()
    );

    const baseContractAddress$ = waitForBaseContractAddress$(
      baseContractDeployment$,
      defaultBaseContractAddress,
      digitalAssetConfiguration?.deployProxy,
      digitalAssetConfiguration?.byteCode
    );

    const digitalAsset$ = lsp8IdentifiableDigitalAssetDeployment$(
      this.signer,
      digitalAssetDeploymentOptions,
      baseContractAddress$,
      digitalAssetConfiguration?.byteCode
    );

    const signerIsUniversalProfile$ = isSignerUniversalProfile$(this.signer);

    const setLSP4AndTransferOwnership$ = setMetadataAndTransferOwnership$(
      this.signer,
      digitalAsset$,
      lsp4Metadata$,
      digitalAssetDeploymentOptions,
      ContractNames.LSP8_DIGITAL_ASSET,
      signerIsUniversalProfile$
    );

    const deployment$ = deploymentWithContractsOnCompletion$<DeployedLSP8IdentifiableDigitalAsset>(
      concat([baseContractDeployment$, digitalAsset$, setLSP4AndTransferOwnership$]).pipe(
        concatAll()
      )
    );

    if (digitalAssetConfiguration?.deployReactive) return deployment$ as LSP8ObservableOrPromise<T>;

    return lastValueFrom(deployment$) as LSP8ObservableOrPromise<T>;
  }
}
