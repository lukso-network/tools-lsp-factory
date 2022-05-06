import { providers, Signer } from 'ethers';
import { Options as IPFSClientOptions } from 'ipfs-http-client';

import { UploadOptions } from './profile-upload-options';

export interface LSPFactoryOptions {
  provider: providers.Web3Provider | providers.JsonRpcProvider;
  chainId: number;
  signer: Signer;
  uploadOptions: UploadOptions;
}

export interface InstantiationOptions {
  chainId?: number;
  ipfsClientOptions?: IPFSClientOptions;
}
