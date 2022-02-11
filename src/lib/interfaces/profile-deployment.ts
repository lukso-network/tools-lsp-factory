import { LSP6KeyManager } from '../..';
import { LSP1UniversalReceiverDelegate, UniversalProfile } from '../../';

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
  ERC725Account?: UniversalProfile;
  KeyManager: LSP6KeyManager;
  UniversalReceiverDelegate: LSP1UniversalReceiverDelegate;
}

export interface BaseContractAddresses {
  erc725AccountInit?: string;
  keyManagerInit?: string;
  universalReceiverDelegateInit?: string;
}

// export interface ContractDeploymentOptions {
//   version?: string;
//   deployReactive?: boolean;
//   byteCode?: {
//     erc725AccountInit: string;
//     keyManagerInit: string;
//     universalReceiverDelegateInit: string;
//   };
//   libAddresses?: BaseContractAddresses;
// }

// TODO: implement new Contract Options structure
interface ContractOptions {
  version?: string;
  byteCode?: string;
  baseContract?: boolean;
  libAddress?: string;
}
export interface ContractDeploymentOptions {
  version?: string; // Master version. Sets version for all contracts
  deployReactive?: boolean;
  ERC725Account?: ContractOptions;
  KeyManager?: ContractOptions;
  UniversalReceiverDelegate?: ContractOptions;
}
