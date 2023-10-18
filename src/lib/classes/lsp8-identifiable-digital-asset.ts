import { NonceManager } from '@ethersproject/experimental';
import { concat, concatAll, EMPTY, shareReplay, switchMap } from 'rxjs';

import versions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import { resolveContractDeployment, waitForContractDeployment } from '../helpers/deployment.helper';
import { LSPFactoryOptions } from '../interfaces';
import {
  ContractNames,
  DeployedLSP8IdentifiableDigitalAsset,
  LSP8ContractDeploymentOptions,
  LSP8IdentifiableDigitalAssetDeploymentOptions,
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
import { isSignerUniversalProfile$ } from '../services/universal-profile.service';

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
   * Returns a Promise with deployed contract details.
   *
   * @param {DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {LSP8ContractDeploymentOptions} contractDeploymentOptions
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
  async deploy(
    digitalAssetDeploymentOptions: LSP8IdentifiableDigitalAssetDeploymentOptions,
    contractDeploymentOptions?: LSP8ContractDeploymentOptions
  ): Promise<DeployedLSP8IdentifiableDigitalAsset> {
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

    const deployment$ = concat([
      baseContractDeployment$,
      digitalAsset$,
      setLSP4AndTransferOwnership$,
    ]).pipe(concatAll());

    if (
      contractDeploymentOptions?.onDeployEvents?.next ||
      contractDeploymentOptions?.onDeployEvents?.error
    ) {
      deployment$.subscribe({
        next: contractDeploymentOptions?.onDeployEvents?.next,
        error: contractDeploymentOptions?.onDeployEvents?.error || (() => null),
      });
    }

    const contractPromise =
      waitForContractDeployment<DeployedLSP8IdentifiableDigitalAsset>(deployment$);

    return resolveContractDeployment(contractPromise, contractDeploymentOptions?.onDeployEvents);
  }
}
