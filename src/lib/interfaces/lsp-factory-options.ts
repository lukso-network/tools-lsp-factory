import { providers, Signer } from 'ethers';
/**
 * TDB
 */
export interface LSPFactoryOptions {
  signer: Signer;
  provider: providers.Web3Provider | providers.JsonRpcProvider;
  chainId: number;
}
