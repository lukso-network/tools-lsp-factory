import { LSP3UniversalProfile } from './classes/lsp3-universal-profile';
import { LSPFactoryOptions } from './interfaces';

/**
 * Factory for creating LSP3UniversalProfiles / LSP4DigitalCertificates
 */
export class LSPFactory {
  options: LSPFactoryOptions;
  LSP3UniversalProfile: LSP3UniversalProfile;
  /**
   * TBD
   *
   * @param {string} deployKey
   * @param {provider} provider
   * @param {number} [chainId=22] Lukso Testnet - 22 (0x16)
   */
  constructor(deployKey: string, provider: any, chainId = 22) {
    this.options = {
      deployKey,
      provider,
      chainId,
    };

    this.LSP3UniversalProfile = new LSP3UniversalProfile(this.options);
  }
}
