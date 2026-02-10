import { PublicClient, WalletClient } from 'viem';

import { LSP7DigitalAsset } from './classes/lsp7-digital-asset';
import { LSP8IdentifiableDigitalAsset } from './classes/lsp8-identifiable-digital-asset';
import { UniversalProfile } from './classes/universal-profile';
import { LSPFactoryOptions } from './interfaces';

export class LSPFactory {
  options: LSPFactoryOptions;
  UniversalProfile: UniversalProfile;
  LSP7DigitalAsset: LSP7DigitalAsset;
  LSP8IdentifiableDigitalAsset: LSP8IdentifiableDigitalAsset;

  constructor(publicClient: PublicClient, walletClient: WalletClient) {
    const chainId = publicClient.chain?.id ?? 4201;

    this.options = {
      publicClient,
      walletClient,
      chainId,
    };

    this.UniversalProfile = new UniversalProfile(this.options);
    this.LSP7DigitalAsset = new LSP7DigitalAsset(this.options);
    this.LSP8IdentifiableDigitalAsset = new LSP8IdentifiableDigitalAsset(this.options);
  }
}
