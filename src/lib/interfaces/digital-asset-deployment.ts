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

interface ContractDeploymentOptionsBase {
  version?: string;
  byteCode?: string;
  libAddress?: string;
  deployProxy?: boolean;
  uploadOptions?: UploadOptions;
}
export interface ContractDeploymentOptionsReactive extends ContractDeploymentOptionsBase {
  deployReactive: true;
}

export interface ContractDeploymentOptionsNonReactive extends ContractDeploymentOptionsBase {
  deployReactive?: false;
}

export type ContractDeploymentOptions =
  | ContractDeploymentOptionsReactive
  | ContractDeploymentOptionsNonReactive;
