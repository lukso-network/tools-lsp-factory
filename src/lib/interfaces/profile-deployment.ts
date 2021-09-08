import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { Contract, ContractTransaction } from 'ethers';
import { Observable } from 'rxjs';

import { LSP3ProfileJSON } from './lsp3-profile';

export enum DeploymentEventType {
  CONTRACT = 1,
  TRANSACTION,
  PROXY_CONTRACT,
}

export enum DeploymentEventStatus {
  DEPLOYING = 1,
  INITIALIZING,
  SUCCESS,
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
  type: DeploymentEventType;
  status: DeploymentEventStatus;
  name: string;
  receipt?: TransactionReceipt;
  initArguments?: unknown[]; // TODO: move to DeploymentEventProxyContract
}

export interface DeploymentEventStandardContract<T> extends DeploymentEventBase {
  type: DeploymentEventType.CONTRACT;
  contract: T;
  transaction?: never;
}

export interface DeploymentEventProxyContract<T extends Contract> extends DeploymentEventBase {
  type: DeploymentEventType.PROXY_CONTRACT;
  transaction: ContractTransaction;
  contract?: T;
  initReceipt?: TransactionReceipt;
}

export type DeploymentEventContract<T extends Contract> =
  | DeploymentEventStandardContract<T>
  | DeploymentEventProxyContract<T>;

export interface DeploymentEventTransaction extends DeploymentEventBase {
  type: DeploymentEventType.TRANSACTION;
  transaction: ContractTransaction;
  contract?: never;
}

export type DeploymentEvent<T extends Contract> =
  | DeploymentEventStandardContract<T>
  | DeploymentEventProxyContract<T>
  | DeploymentEventTransaction;

export type DeploymentEvent$<T extends Contract> = Observable<DeploymentEvent<T>>;

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
