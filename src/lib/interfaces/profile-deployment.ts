import { ContractOptions, DeployedContract } from '../..';

import { LSP3ProfileDataForEncoding, ProfileDataBeforeUpload } from './lsp3-profile';
import { IPFSGateway, UploadOptions } from './profile-upload-options';

export enum ContractNames {
  ERC725_Account = 'LSP0ERC725Account',
  KEY_MANAGER = 'LSP6KeyManager',
  UNIVERSAL_RECEIVER = 'LSP1UniversalReceiverDelegate',
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
  lsp3Profile?: ProfileDataBeforeUpload | LSP3ProfileDataForEncoding | string;
}

export interface DeployedContracts {
  LSP0ERC725Account?: DeployedContract;
  LSP0ERC725AccountBaseContract?: DeployedContract;
  LSP6KeyManager: DeployedContract;
  LSP6KeyManagerBaseContract: DeployedContract;
  LSP1UniversalReceiverDelegate: DeployedContract;
  LSP1UniversalReceiverDelegateBaseContract: DeployedContract;
}

export interface BaseContractAddresses {
  [ContractNames.ERC725_Account]?: string;
  [ContractNames.KEY_MANAGER]?: string;
  [ContractNames.UNIVERSAL_RECEIVER]?: string;
}

interface ContractDeploymentOptionsBase {
  version?: string;
  ipfsGateway?: IPFSGateway;
  LSP0ERC725Account?: ContractOptions;
  ERC725Account?: ContractOptions;
  LSP6KeyManager?: ContractOptions;
  LSP1UniversalReceiverDelegate?: ContractOptions;
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
  LSP0ERC725Account?: ContractConfiguration;
  LSP6KeyManager?: ContractConfiguration;
  LSP1UniversalReceiverDelegate?: ContractConfiguration;
  deployReactive: boolean;
}
