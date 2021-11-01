import { KeyManager } from '../..';
import { LSP3Account } from '../../../types/ethers-v5';
import { ERC725Account } from '../../../types/ethers-v5/ERC725Account';
import { UniversalReceiverDelegate } from '../../tmp/UniversalReceiverDelegate';

import { ProfileDataBeforeUpload } from './lsp3-profile';

export enum ContractNames {
  LSP3_ACCOUNT = 'LSP3Account',
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
    lsp3Account?: string;
    universalReceiverDelegate?: string;
    keyManager?: string;
  };
}
export interface DeployedContracts {
  ERC725Account?: ERC725Account;
  LSP3Account?: LSP3Account;
  KeyManager: KeyManager;
  UniversalReceiverDelegate: UniversalReceiverDelegate;
}

export interface BaseContractAddresses {
  lsp3AccountInit?: string;
  keyManagerInit?: string;
  universalReceiverDelegateInit?: string;
}

export interface ContractDeploymentOptions {
  version?: string;
  byteCode?: {
    lsp3AccountInit: string;
    keyManagerInit: string;
    universalReceiverDelegateInit: string;
  };
  libAddresses?: BaseContractAddresses;
}
