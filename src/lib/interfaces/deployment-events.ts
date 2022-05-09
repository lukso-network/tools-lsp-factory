import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { ContractTransaction } from 'ethers';
import { Observable } from 'rxjs';

export enum DeploymentType {
  CONTRACT = 'DEPLOYMENT',
  TRANSACTION = 'TRANSACTION',
  PROXY = 'PROXY_DEPLOYMENT',
  BASE_CONTRACT = 'BASE_CONTRACT_DEPLOYMENT',
}

export enum DeploymentStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
}

export interface DeployedContract {
  address: string;
  receipt: TransactionReceipt;
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
  | DeploymentEventTransaction
  | DeploymentEventBaseContract;

/**
 * @internal
 */
export type DeploymentEvent$ = Observable<DeploymentEvent>;

export type EthersExternalProvider = {
  isMetaMask?: boolean;
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (
    request: { method: string; params?: Array<any> },
    callback: (error: any, response: any) => void
  ) => void;
  send?: (
    request: { method: string; params?: Array<any> },
    callback: (error: any, response: any) => void
  ) => void;
  request?: (request: { method: string; params?: Array<any> }) => Promise<any>;
};
