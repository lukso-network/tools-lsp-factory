import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { ContractTransaction } from 'ethers';
import { Observable } from 'rxjs';

import { LSP3ProfileJSON } from './lsp3-profile';

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
  lsp3Profile: {
    json: LSP3ProfileJSON;
    url: string;
  };
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

export interface ContractDeploymentOptions {
  version?: string;
  byteCode?: {
    lsp3AccountInit: string;
    keyManagerInit: string;
    universalReceiverAddressStoreInit: string;
  };
  libAddresses?: {
    lsp3AccountInit?: string;
    keyManagerInit?: string;
    universalReceiverAddressStoreInit?: string;
  };
}
