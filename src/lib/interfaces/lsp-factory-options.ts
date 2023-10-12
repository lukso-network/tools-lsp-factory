import { providers, Signer } from 'ethers';

import { UploadProvider } from './profile-upload-options';

export interface LSPFactoryOptions {
  provider: providers.Web3Provider | providers.JsonRpcProvider | string;
  signer: Signer | string;
  uploadProvider?: UploadProvider;
  chainId?: number;
}

export interface LSPFactoryInternalOptions {
  provider: providers.Web3Provider | providers.JsonRpcProvider;
  signer: Signer;
  uploadProvider: UploadProvider;
  chainId: number;
  finishInit: Promise<void>;
}
