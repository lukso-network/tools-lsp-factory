import { KeyManager } from '../..';
import { UniversalProfile, UniversalReceiverDelegate } from '../../';

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
  controllingAccounts: (string | ControllerOptions)[];
  lsp3Profile?: ProfileDataBeforeUpload | string;
  baseContractAddresses?: {
    erc725Account?: string;
    universalReceiverDelegate?: string;
    keyManager?: string;
  };
}
export interface DeployedContracts {
  ERC725Account?: UniversalProfile;
  KeyManager: KeyManager;
  UniversalReceiverDelegate: UniversalReceiverDelegate;
}

export interface BaseContractAddresses {
  erc725AccountInit?: string;
  keyManagerInit?: string;
  universalReceiverDelegateInit?: string;
}

export interface ContractDeploymentOptions {
  version?: string;
  byteCode?: {
    erc725AccountInit: string;
    keyManagerInit: string;
    universalReceiverDelegateInit: string;
  };
  libAddresses?: BaseContractAddresses;
}
