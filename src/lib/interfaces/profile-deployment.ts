import { Options as IPFSClientOptions } from 'ipfs-http-client';

import { DeployedContract } from '../..';

import { LSP3ProfileDataForEncoding, ProfileDataBeforeUpload } from './lsp3-profile';
import { UploadOptions } from './profile-upload-options';

export enum ContractNames {
  ERC725_Account = 'ERC725Account',
  KEY_MANAGER = 'KeyManager',
  UNIVERSAL_RECEIVER = 'UniversalReceiverDelegate',
}

export interface ControllerOptions {
  address: string;
  permissions?: string;
}

/**
 * TBD
 */
export interface ProfileDeploymentOptions {
  controllerAddresses: (string | ControllerOptions)[];
  baseContractAddresses?: {
    erc725Account?: string;
    universalReceiverDelegate?: string;
    keyManager?: string;
  };
  lsp3Profile?: ProfileDataBeforeUpload | LSP3ProfileDataForEncoding | string;
}
export interface DeployedContracts {
  ERC725Account?: DeployedContract;
  ERC725AccountBaseContract?: DeployedContract;
  KeyManager: DeployedContract;
  KeyManagerBaseContract: DeployedContract;
  UniversalReceiverDelegate: DeployedContract;
  UniversalReceiverDelegateBaseContract: DeployedContract;
}

export interface BaseContractAddresses {
  [ContractNames.ERC725_Account]?: string;
  [ContractNames.KEY_MANAGER]?: string;
  [ContractNames.UNIVERSAL_RECEIVER]?: string;
}

interface ContractOptions {
  version?: string;
  deployProxy?: boolean;
}

interface ContractDeploymentOptionsBase {
  version?: string;
  ipfsClientOptions?: IPFSClientOptions;
  ERC725Account?: ContractOptions;
  KeyManager?: ContractOptions;
  UniversalReceiverDelegate?: ContractOptions;
}

export interface ContractDeploymentOptionsReactive extends ContractDeploymentOptionsBase {
  deployReactive: true;
}

export interface ContractDeploymentOptionsNonReactive extends ContractDeploymentOptionsBase {
  deployReactive?: false;
}

export type ContractDeploymentOptions =
  | ContractDeploymentOptionsReactive
  | ContractDeploymentOptionsNonReactive;

interface ContractConfiguration {
  version?: string;
  byteCode?: string;
  libAddress?: string;
  deployProxy?: boolean;
}

export interface UniversalProfileDeploymentConfiguration {
  version?: string;
  uploadOptions?: UploadOptions;
  ERC725Account?: ContractConfiguration;
  KeyManager?: ContractConfiguration;
  UniversalReceiverDelegate?: ContractConfiguration;
  deployReactive: boolean;
}
