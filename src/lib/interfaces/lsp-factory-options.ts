import { providers, Signer } from 'ethers';

import { UploadProvider } from './profile-upload-options';

export interface LSPFactoryOptions {
  provider: providers.Web3Provider | providers.JsonRpcProvider;
  signer: Signer;
  uploadProvider: UploadProvider;
  chainId?: number;
  finishInit: Promise<void>;
}

export interface SignerOptions {
  deployKey?: string | Signer;
  chainId?: number;
}
