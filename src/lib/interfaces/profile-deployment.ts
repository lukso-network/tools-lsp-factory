import { DeployedContract } from '../..';

import { ProfileDataBeforeUpload } from './lsp3-profile';

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
  erc725AccountInit?: string;
  keyManagerInit?: string;
  universalReceiverDelegateInit?: string;
}

interface ContractOptions {
  version?: string;
  byteCode?: string;
  deployProxy?: boolean;
  libAddress?: string;
}
export interface ContractDeploymentOptions {
  version?: string;
  deployReactive?: boolean;
  ERC725Account?: ContractOptions;
  KeyManager?: ContractOptions;
  UniversalReceiverDelegate?: ContractOptions;
}
