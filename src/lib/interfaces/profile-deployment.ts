import { Hex } from 'viem';

import { ContractOptions } from './contract-options';
import { DeployedContract, DeploymentEventCallbacks } from './deployment-events';

export enum ContractNames {
  ERC725_Account = 'LSP0ERC725Account',
  KEY_MANAGER = 'LSP6KeyManager',
  UNIVERSAL_RECEIVER = 'LSP1UniversalReceiverDelegate',
}

export interface ControllerOptions {
  address: Hex;
  permissions?: Hex;
}

export interface ProfileDeploymentOptions {
  controllerAddresses: (Hex | ControllerOptions)[];
  lsp3DataValue?: Hex;
}

export interface DeployedUniversalProfileContracts {
  LSP0ERC725Account: DeployedContract;
  LSP6KeyManager: DeployedContract;
  LSP1UniversalReceiverDelegate?: DeployedContract;
}

export interface ContractDeploymentOptions {
  version?: string;
  salt?: Hex;
  LSP0ERC725Account?: ContractOptions;
  LSP6KeyManager?: ContractOptions;
  LSP1UniversalReceiverDelegate?: ContractOptions;
  onDeployEvents?: DeploymentEventCallbacks<DeployedUniversalProfileContracts>;
}
