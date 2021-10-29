import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { ContractTransaction } from 'ethers';
import { Observable } from 'rxjs';

import { KeyManager, UniversalReceiverAddressStore } from '../..';
import { LSP3Account } from '../../../types/ethers-v5';
import { ERC725Account } from '../../../types/ethers-v5/ERC725Account';

import { ProfileDataBeforeUpload } from './lsp3-profile';

export enum DeploymentType {
  CONTRACT = 'CONTRACT',
  TRANSACTION = 'TRANSACTION',
  PROXY = 'PROXY',
  BASE_CONTRACT = 'BASE_CONTRACT',
}

export enum DeploymentStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
}

export enum ContractNames {
  ERC725_ACCOUNT = 'ERC725Account',
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
    erc725Account?: string;
    universalReceiverAddressStore?: string;
    keyManager?: string;
  };
}

export interface DeploymentEventBase {
  type: DeploymentType;
  status: DeploymentStatus;
  contractName: string;
  transaction?: ContractTransaction;
  receipt?: TransactionReceipt;
}

export interface DeploymentEventStandardContract extends DeploymentEventBase {
  type: DeploymentType.CONTRACT;
}
export interface DeploymentEventBaseContract extends DeploymentEventBase {
  type: DeploymentType.BASE_CONTRACT;
}

export interface DeploymentEventProxyContract extends DeploymentEventBase {
  type: DeploymentType.PROXY;
  functionName?: string;
}

export type DeploymentEventContract =
  | DeploymentEventStandardContract
  | DeploymentEventProxyContract;

export interface DeploymentEventTransaction extends DeploymentEventBase {
  type: DeploymentType.TRANSACTION;
  functionName: string;
  transaction: ContractTransaction;
}

export type DeploymentEvent =
  | DeploymentEventStandardContract
  | DeploymentEventProxyContract
  | DeploymentEventTransaction;

export type DeploymentEvent$ = Observable<DeploymentEvent>;

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
    erc725AccountInit: string;
    keyManagerInit: string;
    universalReceiverAddressStoreInit: string;
  };
  libAddresses?: BaseContractAddresses;
}
