import { ethers, providers, Signer } from 'ethers';

import { UniversalProfile } from './classes/lsp3-universal-profile';
import { LSP4DigitalAssetMetadata } from './classes/lsp4-digital-asset-metadata';
import { LSP7DigitalAsset } from './classes/lsp7-digital-asset';
import { LSP8IdentifiableDigitalAsset } from './classes/lsp8-identifiable-digital-asset';
import { ProxyDeployer } from './classes/proxy-deployer';
import { EthersExternalProvider, LSPFactoryOptions } from './interfaces';
import { SignerOptions } from './interfaces/lsp-factory-options';

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
   * @param {string | Signer | SignerOptions} privateKeyOrSigner
   * @param {number} [chainId=22] Lukso Testnet - 22 (0x16)
   */
  constructor(
    rpcUrlOrProvider:
      | string
      | providers.Web3Provider
      | providers.JsonRpcProvider
      | EthersExternalProvider,
    privateKeyOrSigner?: string | Signer | SignerOptions
  ) {
    let signer: Signer;
    let provider: providers.Web3Provider | providers.JsonRpcProvider;
    let ipfsGateway;
    let chainId;

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
    } else {
      if (privateKeyOrSigner?.deployKey instanceof Signer) {
        signer = privateKeyOrSigner.deployKey;
      } else if (typeof privateKeyOrSigner?.deployKey === 'string') {
        signer = new ethers.Wallet(privateKeyOrSigner.deployKey, provider);
      } else {
        signer = provider.getSigner();
      }

      chainId = privateKeyOrSigner?.chainId;
      ipfsGateway = privateKeyOrSigner?.ipfsGateway;
    }

    this.options = {
      signer,
      provider,
      chainId: chainId || 22,
      uploadOptions: ipfsGateway ? { ipfsGateway } : undefined,
    };

    this.UniversalProfile = new UniversalProfile(this.options);
    this.LSP4DigitalAssetMetadata = new LSP4DigitalAssetMetadata(this.options);
    this.LSP7DigitalAsset = new LSP7DigitalAsset(this.options);
    this.LSP8IdentifiableDigitalAsset = new LSP8IdentifiableDigitalAsset(this.options);
    this.ProxyDeployer = new ProxyDeployer(this.options.signer);
  }
}
