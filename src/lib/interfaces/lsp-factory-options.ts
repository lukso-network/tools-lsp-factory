import { providers, Signer } from 'ethers';
/**
 * TDB
 */
export interface LSPFactoryOptions {
  provider: providers.Web3Provider | providers.JsonRpcProvider;
  chainId: number;
  signer: Signer;
  signerPermissions?: string;
}

export interface SignerOptions {
  address: string;
  permissions?: string;
}
