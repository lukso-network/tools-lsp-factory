import { ethers, providers, Signer } from 'ethers';

import { DigitalAsset } from './classes/digital-asset';
import { LSP3UniversalProfile } from './classes/lsp3-universal-profile';
import { ProxyDeployer } from './classes/proxy-deployer';
import { LSPFactoryOptions } from './interfaces';
import { SignerOptions } from './interfaces/lsp-factory-options';

/**
 * Factory for creating UniversalProfiles and Digital Assets
 */
export class LSPFactory {
  options: LSPFactoryOptions;
  LSP3UniversalProfile: LSP3UniversalProfile;
  DigitalAsset: DigitalAsset;
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

    this.DigitalAsset = new DigitalAsset(this.options);
    this.LSP3UniversalProfile = new LSP3UniversalProfile(this.options);
    this.ProxyDeployer = new ProxyDeployer(this.options.signer);
  }
}
