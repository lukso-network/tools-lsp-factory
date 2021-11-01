import { KeyManager, UniversalReceiverAddressStore } from '../..';
import { LSP3Account } from '../../../types/ethers-v5';
import { ERC725Account } from '../../../types/ethers-v5/ERC725Account';

import { ProfileDataBeforeUpload } from './lsp3-profile';

export enum ContractNames {
  LSP3_ACCOUNT = 'LSP3Account',
  KEY_MANAGER = 'KeyManager',
  UNIVERSAL_RECEIVER = 'UniversalReceiverAddressStore',
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
    universalReceiverAddressStore?: string;
    keyManager?: string;
  };
}
export interface DeployedContracts {
  ERC725Account?: ERC725Account;
  LSP3Account?: LSP3Account;
  KeyManager: KeyManager;
  UniversalReceiverAddressStore: UniversalReceiverAddressStore;
}

export interface BaseContractAddresses {
  lsp3AccountInit?: string;
  keyManagerInit?: string;
  universalReceiverAddressStoreInit?: string;
}

export interface ContractDeploymentOptions {
  version?: string;
  byteCode?: {
    lsp3AccountInit: string;
    keyManagerInit: string;
    universalReceiverAddressStoreInit: string;
  };
  libAddresses?: BaseContractAddresses;
}
