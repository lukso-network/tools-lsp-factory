import { Hex, TransactionReceipt } from 'viem';

export enum DeploymentType {
  DEPLOYMENT = 'DEPLOYMENT',
  TRANSACTION = 'TRANSACTION',
  PROXY = 'PROXY_DEPLOYMENT',
  BASE_CONTRACT = 'BASE_CONTRACT_DEPLOYMENT',
}

export enum DeploymentStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
}

export interface DeployedContract {
  address: Hex;
  receipt: TransactionReceipt;
}

export interface DeploymentEvent {
  type: DeploymentType;
  status: DeploymentStatus;
  contractName: string;
  functionName?: string;
  txHash?: Hex;
  receipt?: TransactionReceipt;
}

export interface DeploymentEventCallbacks<T> {
  next?: (value: DeploymentEvent) => void;
  error?: (error: unknown) => void;
  complete?: (contracts: T) => void;
}
