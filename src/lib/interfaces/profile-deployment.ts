import { ContractOptions, DeployedContract } from '../..';

import {
  LSP3ProfileBeforeUpload,
  LSP3ProfileDataForEncoding,
  ProfileDataBeforeUpload,
} from './lsp3-profile';
import { UploadProvider } from './profile-upload-options';

import { DeploymentEventCallbacks } from '.';

export enum ContractNames {
  ERC725_Account = 'LSP0ERC725Account',
  KEY_MANAGER = 'LSP6KeyManager',
  UNIVERSAL_RECEIVER = 'LSP1UniversalReceiverDelegate',
}

export interface ControllerOptions {
  address: string;
  permissions?: string;
}

/**
 * TBD
 */
export interface ProfileDeploymentOptions {
  controllerAddresses: (string | ControllerOptions)[];
  lsp3Profile?:
    | ProfileDataBeforeUpload
    | LSP3ProfileBeforeUpload
    | LSP3ProfileDataForEncoding
    | string;
}

export interface DeployedUniversalProfileContracts {
  LSP0ERC725Account: DeployedContract;
  LSP0ERC725AccountBaseContract?: DeployedContract;
  LSP6KeyManager: DeployedContract;
  LSP6KeyManagerBaseContract: DeployedContract;
  LSP1UniversalReceiverDelegate: DeployedContract;
  LSP1UniversalReceiverDelegateBaseContract: DeployedContract;
}

export interface BaseContractAddresses {
  [ContractNames.ERC725_Account]?: string;
  [ContractNames.KEY_MANAGER]?: string;
  [ContractNames.UNIVERSAL_RECEIVER]?: string;
}

export interface ContractDeploymentOptions {
  version?: string;
  uploadProvider?: UploadProvider;
  LSP0ERC725Account?: ContractOptions;
  ERC725Account?: ContractOptions;
  LSP6KeyManager?: ContractOptions;
  LSP1UniversalReceiverDelegate?: ContractOptions;
  onDeployEvents?: DeploymentEventCallbacks<DeployedUniversalProfileContracts>;
}

interface ContractConfiguration {
  version?: string;
  byteCode?: string;
  libAddress?: string;
  deployProxy?: boolean;
}

export interface UniversalProfileDeploymentConfiguration {
  version?: string;
  uploadProvider?: UploadProvider;
  LSP0ERC725Account?: ContractConfiguration;
  LSP6KeyManager?: ContractConfiguration;
  LSP1UniversalReceiverDelegate?: ContractConfiguration;
}
