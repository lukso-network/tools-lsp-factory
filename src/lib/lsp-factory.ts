import { ethers, providers, Signer } from 'ethers';

import { LSP3UniversalProfile } from './classes/lsp3-universal-profile';
import { LSP4DigitalAssetMetadata } from './classes/lsp4-digital-asset-metadata';
import { LSP7DigitalAsset } from './classes/lsp7-digital-asset';
import { LSP8IdentifiableDigitalAsset } from './classes/lsp8-identifiable-digital-asset';
import { ProxyDeployer } from './classes/proxy-deployer';
import { EthersExternalProvider, LSPFactoryOptions } from './interfaces';
import { InstantiationOptions } from './interfaces/lsp-factory-options';

/**
 * Factory for creating UniversalProfiles and Digital Assets
 */
export class LSPFactory {
  options: LSPFactoryOptions;
  LSP3UniversalProfile: LSP3UniversalProfile;
  LSP4DigitalAssetMetadata: LSP4DigitalAssetMetadata;
  LSP7DigitalAsset: LSP7DigitalAsset;
  LSP8IdentifiableDigitalAsset: LSP8IdentifiableDigitalAsset;
  ProxyDeployer: ProxyDeployer;
  /**
   *
   * @param {string | providers.Web3Provider | providers.JsonRpcProvider | EthersExternalProvider } rpcUrlOrProvider
   * @param {string | Signer} privateKeyOrSigner
   * @param { InstantiationOptions } options
   * @param {number} [chainId=22] Lukso Testnet - 22 (0x16)
   */
  constructor(
    rpcUrlOrProvider:
      | string
      | providers.Web3Provider
      | providers.JsonRpcProvider
      | EthersExternalProvider,
    privateKeyOrSigner?: string | Signer,
    options?: InstantiationOptions
  ) {
    let signer: Signer;
    let provider: providers.Web3Provider | providers.JsonRpcProvider;
    const ipfsClientOptions = options?.ipfsClientOptions;
    const chainId = options?.chainId || 22;

    if (typeof rpcUrlOrProvider === 'string') {
      provider = new ethers.providers.JsonRpcProvider(rpcUrlOrProvider);
    } else if ('chainId' in rpcUrlOrProvider) {
      provider = new ethers.providers.Web3Provider(rpcUrlOrProvider);
    } else if (typeof rpcUrlOrProvider !== 'string') {
      provider = rpcUrlOrProvider as providers.Web3Provider | providers.JsonRpcProvider;
    }

    if (privateKeyOrSigner instanceof Signer) {
      signer = privateKeyOrSigner;
    } else if (typeof privateKeyOrSigner === 'string') {
      signer = new ethers.Wallet(privateKeyOrSigner, provider);
    } else if (!privateKeyOrSigner) {
      signer = provider.getSigner();
    }

    this.options = {
      signer,
      provider,
      chainId,
      uploadOptions: ipfsClientOptions ? { ipfsClientOptions } : undefined,
    };

    this.LSP3UniversalProfile = new LSP3UniversalProfile(this.options);
    this.LSP4DigitalAssetMetadata = new LSP4DigitalAssetMetadata(this.options);
    this.LSP7DigitalAsset = new LSP7DigitalAsset(this.options);
    this.LSP8IdentifiableDigitalAsset = new LSP8IdentifiableDigitalAsset(this.options);
    this.ProxyDeployer = new ProxyDeployer(this.options.signer);
  }
}
