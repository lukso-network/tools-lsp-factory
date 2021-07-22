import { LSP3UniversalProfile } from './classes/lsp3-universal-profile';
import { LSPFactoryOptions } from './interfaces';

/**
 * Factory for creating LSP3UniversalProfiles / LSP4DigitalCertificates
 *
 */
export class LSPFactory {
  options: LSPFactoryOptions;
  LSP3UniversalProfile: LSP3UniversalProfile;
  /**
   * **Example Web3**
   *
   * ```typescript
   * import { LSPFactory} from 'lspFactory.js';
   *
   * const myLSPFactory = new LSPFactory('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', provider);
   * const { erc725Account, basicKeyManager } = await myLSPFactory.createLSP3UniversalProfile({
   *    controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
   *    lsp3ProfileJson
   * });
   * ```
   *
   * **Example Ethers.js**
   *
   * ```typescript
   * import { LSPFactory} from 'lspFactory.js';
   *
   * const myLSPFactory = new LSPFactory('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', provider);
   * const { erc725Account, basicKeyManager } = await myLSPFactory.createLSP3UniversalProfile({
   *    controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
   *    lsp3ProfileJson
   * });
   * ```
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
