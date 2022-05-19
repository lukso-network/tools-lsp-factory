import { providers, Signer } from 'ethers';

import { IPFSGateway, UploadOptions } from './profile-upload-options';

export interface LSPFactoryOptions {
  provider: providers.Web3Provider | providers.JsonRpcProvider;
  chainId: number;
  signer: Signer;
  uploadOptions: UploadOptions;
}

export interface SignerOptions {
  deployKey?: string | Signer;
  chainId?: number;
  ipfsGateway?: IPFSGateway;
}
