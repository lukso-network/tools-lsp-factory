import { DeployedContract } from '../..';

import { ProfileDataBeforeUpload } from './lsp3-profile';
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
  lsp3Profile?: ProfileDataBeforeUpload | string;
  baseContractAddresses?: {
    erc725Account?: string;
    universalReceiverDelegate?: string;
    keyManager?: string;
  };
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
  byteCode?: string;
  deployProxy?: boolean;
  libAddress?: string;
}

export interface ContractDeploymentOptionsReactive {
  version?: string;
  deployReactive: true;
  uploadOptions?: UploadOptions;
  ERC725Account?: ContractOptions;
  KeyManager?: ContractOptions;
  UniversalReceiverDelegate?: ContractOptions;
}

export interface ContractDeploymentOptionsNonReactive {
  version?: string;
  deployReactive?: false;
  uploadOptions?: UploadOptions;
  ERC725Account?: ContractOptions;
  KeyManager?: ContractOptions;
  UniversalReceiverDelegate?: ContractOptions;
}

export type ContractDeploymentOptions =
  | ContractDeploymentOptionsReactive
  | ContractDeploymentOptionsNonReactive;
