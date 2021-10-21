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
}

export enum DeploymentStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
}

export enum ContractNames {
  LSP3_ACCOUNT = 'LSP3Account',
  KEY_MANAGER = 'KeyManager',
  UNIVERSAL_RECEIVER = 'UniversalReceiverAddressStore',
}

/**
 * TBD
 */
export interface ProfileDeploymentOptions {
  controllerAddresses: string[];
  lsp3Profile: ProfileDataBeforeUpload | string;
  baseContractAddresses?: {
    lsp3Account?: string;
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
  UniversalReceiverDelegate: UniversalReceiverAddressStore;
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
