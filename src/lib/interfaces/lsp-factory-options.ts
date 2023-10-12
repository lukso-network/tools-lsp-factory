import { providers, Signer } from 'ethers';

import { EthersExternalProvider } from './deployment-events';
import { UploadProvider } from './profile-upload-options';

export interface LSPFactoryOptions {
  signer: Signer | string;
  uploadProvider?: UploadProvider;
  chainId?: number;
}

export interface LSPFactoryInternalOptions {
  provider: providers.Web3Provider | providers.JsonRpcProvider | EthersExternalProvider;
  signer: Signer;
  uploadProvider: UploadProvider;
  chainId: number;
  finishInit: Promise<void>;
}
