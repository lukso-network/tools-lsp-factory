import { providers, Signer } from 'ethers';
/**
 * TDB
 */
export interface LSPFactoryOptions {
  deployer: Signer;
  provider: providers.Web3Provider | providers.JsonRpcProvider;
  chainId: number;
}
