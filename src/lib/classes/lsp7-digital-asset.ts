import { NonceManager } from '@ethersproject/experimental';
import { concat, concatAll, EMPTY, shareReplay, switchMap } from 'rxjs';

import versions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import { resolveContractDeployment, waitForContractDeployment } from '../helpers/deployment.helper';
import { LSPFactoryOptions } from '../interfaces';
import {
  ContractNames,
  DeployedLSP7DigitalAsset,
  LSP7ContractDeploymentOptions,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';
import {
  lsp7BaseContractDeployment$,
  shouldDeployBaseContract$,
  waitForBaseContractAddress$,
} from '../services/base-contract.service';
import {
  convertDigitalAssetConfigurationObject,
  lsp4MetadataUpload$,
  lsp7DigitalAssetDeployment$,
  setMetadataAndTransferOwnership$,
} from '../services/digital-asset.service';
import { isSignerUniversalProfile$ } from '../services/universal-profile.service';

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
   * Returns a Promise with deployed contract details
   *
   * @param {LSP7DigitalAssetDeploymentOptions} digitalAssetDeploymentOptions
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Promise<Deployed<LSP7DigitalAsset>
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
  async deploy(
    digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
    contractDeploymentOptions?: LSP7ContractDeploymentOptions
  ): Promise<DeployedLSP7DigitalAsset> {
    const digitalAssetConfiguration = contractDeploymentOptions
      ? convertDigitalAssetConfigurationObject(contractDeploymentOptions)
      : null;

    const lsp4Metadata$ = lsp4MetadataUpload$(
      digitalAssetDeploymentOptions.digitalAssetMetadata,
      digitalAssetConfiguration?.uploadOptions ?? this.options.uploadOptions
    );

    const defaultBaseContractAddress: string | undefined =
      digitalAssetConfiguration?.libAddress ??
      versions[this.options.chainId]?.contracts.LSP7Mintable?.versions[
        digitalAssetConfiguration?.version ?? DEFAULT_CONTRACT_VERSION
      ];

    const deployBaseContract$ = shouldDeployBaseContract$(
      this.options.provider,
      versions[this.options.chainId]?.contracts.LSP7Mintable?.baseContract,
      digitalAssetConfiguration?.deployProxy,
      defaultBaseContractAddress,
      digitalAssetConfiguration?.libAddress,
      digitalAssetConfiguration?.byteCode
    );

    const baseContractDeployment$ = deployBaseContract$.pipe(
      switchMap((shouldDeployBaseContract) => {
        return shouldDeployBaseContract ? lsp7BaseContractDeployment$(this.options.signer) : EMPTY;
      }),
      shareReplay()
    );

    const baseContractAddress$ = waitForBaseContractAddress$(
      baseContractDeployment$,
      defaultBaseContractAddress,
      digitalAssetConfiguration?.deployProxy,
      digitalAssetConfiguration?.byteCode
    );

    const digitalAsset$ = lsp7DigitalAssetDeployment$(
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
      ContractNames.LSP7_DIGITAL_ASSET,
      signerIsUniversalProfile$
    );

    const deployment$ = concat([
      baseContractDeployment$,
      digitalAsset$,
      setLSP4AndTransferOwnership$,
    ]).pipe(concatAll(), shareReplay());

    if (
      contractDeploymentOptions?.onDeployEvents?.next ||
      contractDeploymentOptions?.onDeployEvents?.error
    ) {
      deployment$.subscribe({
        next: contractDeploymentOptions?.onDeployEvents?.next,
        error: contractDeploymentOptions?.onDeployEvents?.error || (() => null),
      });
    }

    const contractsPromise = waitForContractDeployment<DeployedLSP7DigitalAsset>(deployment$);

    return resolveContractDeployment(contractsPromise, contractDeploymentOptions?.onDeployEvents);
  }
}
