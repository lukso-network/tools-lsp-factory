import { ethers, providers, Signer } from 'ethers';

import { LSP4DigitalAssetMetadata } from './classes/lsp4-digital-asset-metadata';
import { LSP7DigitalAsset } from './classes/lsp7-digital-asset';
import { LSP8IdentifiableDigitalAsset } from './classes/lsp8-identifiable-digital-asset';
import { ProxyDeployer } from './classes/proxy-deployer';
import { UniversalProfile } from './classes/universal-profile';
import { EthersExternalProvider, LSPFactoryOptions } from './interfaces';
import { SignerOptions } from './interfaces/lsp-factory-options';
import { UploadProvider } from './interfaces/profile-upload-options';

/**
 * Factory for creating UniversalProfiles and Digital Assets
 */
export class LSPFactory {
  options: LSPFactoryOptions;
  UniversalProfile: UniversalProfile;
  LSP4DigitalAssetMetadata: LSP4DigitalAssetMetadata;
  LSP7DigitalAsset: LSP7DigitalAsset;
  LSP8IdentifiableDigitalAsset: LSP8IdentifiableDigitalAsset;
  ProxyDeployer: ProxyDeployer;
  /**
   *
   * @param {string | providers.Web3Provider | providers.JsonRpcProvider | EthersExternalProvider } rpcUrlOrProvider
   * @param {UploadProvider} uploadProvider
   */
  constructor(
    rpcUrlOrProvider:
      | string
      | providers.Web3Provider
      | providers.JsonRpcProvider
      | EthersExternalProvider,
    uploadProvider?: UploadProvider
  );
  /**
   *
   * @param {string | providers.Web3Provider | providers.JsonRpcProvider | EthersExternalProvider } rpcUrlOrProvider
   * @param {string | Signer | SignerOptions} privateKeyOrSigner
   * @param {number} [chainId=4201] Lukso Testnet - 4201 (0x1069)
   */
  constructor(
    rpcUrlOrProvider:
      | string
      | providers.Web3Provider
      | providers.JsonRpcProvider
      | EthersExternalProvider,
    privateKeyOrSigner?: string | Signer | SignerOptions | UploadProvider,
    uploadProvider?: UploadProvider
  ) {
    let signer: Signer;
    let provider: providers.Web3Provider | providers.JsonRpcProvider;
    let chainId: number;

    if (typeof rpcUrlOrProvider === 'string') {
      provider = new ethers.providers.JsonRpcProvider(rpcUrlOrProvider);
    } else if ('chainId' in rpcUrlOrProvider) {
      provider = new ethers.providers.Web3Provider(rpcUrlOrProvider);
    } else if (typeof rpcUrlOrProvider !== 'string') {
      provider = rpcUrlOrProvider as providers.Web3Provider | providers.JsonRpcProvider;
    }

    if (!uploadProvider && privateKeyOrSigner && typeof privateKeyOrSigner === 'function') {
      uploadProvider = privateKeyOrSigner as UploadProvider;
      privateKeyOrSigner = undefined;
    }
    if (privateKeyOrSigner instanceof Signer) {
      signer = privateKeyOrSigner;
    } else if (typeof privateKeyOrSigner === 'string') {
      signer = new ethers.Wallet(privateKeyOrSigner, provider);
    } else {
      const signerOptions = privateKeyOrSigner as SignerOptions;
      if (signerOptions?.deployKey instanceof Signer) {
        signer = signerOptions.deployKey;
      } else if (typeof signerOptions?.deployKey === 'string') {
        signer = new ethers.Wallet(signerOptions.deployKey, provider);
        if (signerOptions?.chainId) {
          chainId = signerOptions.chainId;
        }
      } else {
        signer = provider.getSigner();
      }
    }
    const finishInit: Promise<void> = chainId
      ? Promise.resolve()
      : this.options.provider.getNetwork().then((network) => {
          this.options.chainId = network.chainId;
        });
    this.options = {
      signer,
      provider,
      uploadProvider,
      chainId,
      finishInit,
    };

    this.UniversalProfile = new UniversalProfile(this.options);
    this.LSP4DigitalAssetMetadata = new LSP4DigitalAssetMetadata(this.options);
    this.LSP7DigitalAsset = new LSP7DigitalAsset(this.options);
    this.LSP8IdentifiableDigitalAsset = new LSP8IdentifiableDigitalAsset(this.options);
    this.ProxyDeployer = new ProxyDeployer(this.options.signer);
  }
}
