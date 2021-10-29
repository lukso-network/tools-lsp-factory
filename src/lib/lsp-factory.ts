import { ethers, providers, Signer } from 'ethers';

import { ERC725UniversalProfile } from './classes/erc725-universal-profile';
import { ProxyDeployer } from './classes/proxy-deployer';
import { LSPFactoryOptions } from './interfaces';
import { SignerOptions } from './interfaces/lsp-factory-options';

/**
 * Factory for creating LSP3UniversalProfiles / LSP4DigitalCertificates
 */
export class LSPFactory {
  options: LSPFactoryOptions;
  ERC725UniversalProfile: ERC725UniversalProfile;
  ProxyDeployer: ProxyDeployer;
  /**
   * TBD
   *
   * @param {string | providers.Web3Provider | providers.JsonRpcProvider} rpcUrlOrProvider
   * @param {string | Signer | SignerOptions} privateKeyOrSigner
   * @param {number} [chainId=22] Lukso Testnet - 22 (0x16)
   */
  constructor(
    rpcUrlOrProvider: string | providers.Web3Provider | providers.JsonRpcProvider,
    privateKeyOrSigner: string | Signer | SignerOptions
  ) {
    let signer: Signer;
    let provider: providers.Web3Provider | providers.JsonRpcProvider;
    let chainId = 22;

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
    } else if (typeof privateKeyOrSigner === 'string') {
      signer = new ethers.Wallet(privateKeyOrSigner, provider);
    } else {
      signer = new ethers.Wallet(privateKeyOrSigner.deployKey, provider);
      chainId = privateKeyOrSigner.chainId;
    }

    this.options = {
      signer,
      provider,
      chainId,
    };

    this.ERC725UniversalProfile = new ERC725UniversalProfile(this.options);
    this.ProxyDeployer = new ProxyDeployer(this.options.signer);
  }
}
