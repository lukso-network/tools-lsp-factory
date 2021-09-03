import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { ContractTransaction } from 'ethers';
import { Observable } from 'rxjs';

import { LSP3ProfileJSON } from './lsp3-profile';

export const enum DEPLOYMENT_EVENT {
  CONTRACT = 1,
  TRANSACTION = 2,
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
}

export interface DeploymentEventBase {
  type: DEPLOYMENT_EVENT;
  name: string;
  receipt?: TransactionReceipt;
}

export interface DeploymentEventContract<T> extends DeploymentEventBase {
  type: DEPLOYMENT_EVENT.CONTRACT;
  contract: T;
  transaction?: never;
}

export interface DeploymentEventTransaction extends DeploymentEventBase {
  type: DEPLOYMENT_EVENT.TRANSACTION;
  transaction: ContractTransaction;
  contract?: never;
}

export type DeploymentEvent<T> = DeploymentEventContract<T> | DeploymentEventTransaction;
export type DeploymentEvent$<T> = Observable<DeploymentEvent<T>>;
