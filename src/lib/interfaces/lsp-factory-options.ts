import { providers, Signer } from 'ethers';
/**
 * TDB
 */
export interface LSPFactoryOptions {
  provider: providers.Web3Provider | providers.JsonRpcProvider;
  chainId: number;
  signer: Signer;
}

export interface SignerOptions {
  address: string;
  permissions?: string;
}
