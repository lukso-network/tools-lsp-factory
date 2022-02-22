import { providers, Signer } from 'ethers';

import { UploadOptions } from './profile-upload-options';
/**
 * TDB
 */
export interface LSPFactoryOptions {
  provider: providers.Web3Provider | providers.JsonRpcProvider;
  chainId: number;
  signer: Signer;
  uploadOptions: UploadOptions;
}

export interface SignerOptions {
  deployKey: string;
  chainId: number;
  uploadOptions?: UploadOptions;
}
