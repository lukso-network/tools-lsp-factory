import { ethers, providers, Signer } from 'ethers';

import { LSP3UniversalProfile } from './classes/lsp3-universal-profile';
import { ProxyDeployer } from './classes/proxy-deployer';
import { LSPFactoryOptions } from './interfaces';

/**
 * Factory for creating LSP3UniversalProfiles / LSP4DigitalCertificates
 */
export class LSPFactory {
  options: LSPFactoryOptions;
  LSP3UniversalProfile: LSP3UniversalProfile;
  ProxyDeployer: ProxyDeployer;
  /**
   * TBD
   *
   * @param {string} deployKey
   * @param {provider} rpcUrlOrProvider
   * @param {number} [chainId=22] Lukso Testnet - 22 (0x16)
   */
  constructor(
    privateKeyOrSigner: string | Signer,
    rpcUrlOrProvider: string | providers.Web3Provider | providers.JsonRpcProvider,
    chainId = 22
  ) {
    let signer: Signer;
    let provider: providers.Web3Provider | providers.JsonRpcProvider;

    if (
      rpcUrlOrProvider instanceof providers.Web3Provider ||
      rpcUrlOrProvider instanceof providers.JsonRpcProvider
    ) {
      provider = rpcUrlOrProvider;
    } else {
      provider = new ethers.providers.JsonRpcProvider(rpcUrlOrProvider);
    }

    if (privateKeyOrSigner instanceof Signer) {
      signer = privateKeyOrSigner;
    } else {
      signer = new ethers.Wallet(privateKeyOrSigner, provider);
    }

    this.options = {
      signer,
      provider,
      chainId,
    };

    this.LSP3UniversalProfile = new LSP3UniversalProfile(this.options);
    this.ProxyDeployer = new ProxyDeployer(this.options.signer);
  }
}
