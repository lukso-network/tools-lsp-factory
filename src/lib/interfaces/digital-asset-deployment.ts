import { LSP4MetadataBeforeUpload } from './lsp4-digital-asset';
import { UploadOptions } from './profile-upload-options';

import { DeployedContract } from '.';

export enum ContractNames {
  LSP7_DIGITAL_ASSET = 'LSP7DigitalAsset',
  LSP8_DIGITAL_ASSET = 'LSP8IdentifiableDigitalAsset',
}

export interface DigitalAssetDeploymentOptions {
  controllerAddress: string;
  name: string;
  symbol: string;
  digitalAssetMetadata?: LSP4MetadataBeforeUpload | string;
  creators?: string[];
}

export interface LSP7DigitalAssetDeploymentOptions extends DigitalAssetDeploymentOptions {
  isNFT: boolean;
}

export interface DeployedLSP8IdentifiableDigitalAsset {
  LSP8IdentifiableDigitalAsset: DeployedContract;
}

export interface DeployedLSP7DigitalAsset {
  LSP7DigitalAsset: DeployedContract;
}

export interface ContractDeploymentOptionsReactive {
  version?: string;
  byteCode?: string;
  libAddress?: string;
  deployReactive: true;
  deployProxy?: boolean;
  uploadOptions?: UploadOptions;
}

export interface ContractDeploymentOptionsNonReactive {
  version?: string;
  byteCode?: string;
  libAddress?: string;
  deployReactive?: false;
  deployProxy?: boolean;
  uploadOptions?: UploadOptions;
}

export type ContractDeploymentOptions =
  | ContractDeploymentOptionsReactive
  | ContractDeploymentOptionsNonReactive;
