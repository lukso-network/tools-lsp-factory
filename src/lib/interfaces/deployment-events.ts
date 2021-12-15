import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { ContractTransaction } from 'ethers';
import { Observable } from 'rxjs';

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

/**
 * @internal
 */
export type DeploymentEvent$ = Observable<DeploymentEvent>;
