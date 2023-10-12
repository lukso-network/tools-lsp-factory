import { ethers } from 'ethers';

import { LSP4DigitalAssetMetadata } from './classes/lsp4-digital-asset-metadata';
import { LSP7DigitalAsset } from './classes/lsp7-digital-asset';
import { LSP8IdentifiableDigitalAsset } from './classes/lsp8-identifiable-digital-asset';
import { ProxyDeployer } from './classes/proxy-deployer';
import { UniversalProfile } from './classes/universal-profile';
import { LSPFactoryOptions } from './interfaces';
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

  constructor(options: Partial<LSPFactoryOptions> = {}) {
    if (!options) {
      throw new TypeError('Options required');
    }
    if (!options.provider) {
      throw new TypeError('Provider value required');
    }
    const provider =
      typeof options.provider === 'string'
        ? new ethers.providers.JsonRpcProvider(options.provider)
        : options.provider;
    const signer =
      typeof options.signer === 'string'
        ? provider.getSigner(options.signer)
        : options.signer || provider.getSigner();
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
      if (!('getNetwork' in this.options.provider)) {
        throw new TypeError('Provider must have getNetwork method or chainId must be set');
      }
      this.options.finishInit = this.options.provider.getNetwork().then((network) => {
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
