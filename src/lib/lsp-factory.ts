import { ethers, providers } from 'ethers';

import { LSP4DigitalAssetMetadata } from './classes/lsp4-digital-asset-metadata';
import { LSP7DigitalAsset } from './classes/lsp7-digital-asset';
import { LSP8IdentifiableDigitalAsset } from './classes/lsp8-identifiable-digital-asset';
import { ProxyDeployer } from './classes/proxy-deployer';
import { UniversalProfile } from './classes/universal-profile';
import { EthersExternalProvider, LSPFactoryOptions } from './interfaces';
import { LSPFactoryInternalOptions } from './interfaces/lsp-factory-options';

export const errorUploadProvider = () => {
  throw new Error('No upload provider set');
};

/**
 * Factory for creating UniversalProfiles and Digital Assets
 */
export class LSPFactory {
  options: LSPFactoryInternalOptions;
  UniversalProfile: UniversalProfile;
  LSP4DigitalAssetMetadata: LSP4DigitalAssetMetadata;
  LSP7DigitalAsset: LSP7DigitalAsset;
  LSP8IdentifiableDigitalAsset: LSP8IdentifiableDigitalAsset;
  ProxyDeployer: ProxyDeployer;

  constructor(
    _provider: providers.Web3Provider | providers.JsonRpcProvider | EthersExternalProvider,
    options: Partial<LSPFactoryOptions> = {}
  ) {
    if (!options) {
      throw new TypeError('Options required');
    }
    if (!_provider) {
      throw new TypeError('Provider value required');
    }
    const provider =
      typeof _provider === 'string' ? new ethers.providers.JsonRpcProvider(_provider) : _provider;
    let signer: providers.JsonRpcSigner | ethers.Signer;
    if (typeof options.signer === 'object' && options.signer) {
      signer = options.signer;
    } else if (typeof options.signer === 'string') {
      if (!('getSigner' in provider)) {
        throw new Error('There is no getSigner accepting a string on this provider to call');
      }
      signer = provider.getSigner(options.signer);
    } else {
      signer = 'getSigner' in provider ? provider.getSigner() : (provider as ethers.Signer);
    }
    this.options = {
      signer,
      provider,
      uploadProvider: options.uploadProvider || errorUploadProvider,
      chainId: options.chainId || 41,
      finishInit: Promise.resolve(),
    };

    // Must come after because this.options will otherwise be undefined,
    // but finishInit needs to have a value before we can create this.options.
    // The egg came first.
    if (!options.chainId) {
      if (!('getNetwork' in _provider)) {
        throw new TypeError('Provider must have getNetwork method or chainId must be set');
      }
      this.options.finishInit = _provider.getNetwork().then((network) => {
        this.options.chainId = network.chainId;
      });
    }

    this.UniversalProfile = new UniversalProfile(this.options);
    this.LSP4DigitalAssetMetadata = new LSP4DigitalAssetMetadata(this.options);
    this.LSP7DigitalAsset = new LSP7DigitalAsset(this.options);
    this.LSP8IdentifiableDigitalAsset = new LSP8IdentifiableDigitalAsset(this.options);
    this.ProxyDeployer = new ProxyDeployer(this.options.signer);
  }
}
