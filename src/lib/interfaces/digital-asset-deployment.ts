import { LSP4MetadataBeforeUpload, LSP4MetadataForEncoding } from './lsp4-digital-asset';
import { IPFSGateway, UploadOptions } from './profile-upload-options';

import { ContractOptions, DeployedContract } from '.';

export enum ContractNames {
  LSP7_DIGITAL_ASSET = 'LSP7DigitalAsset',
  LSP8_DIGITAL_ASSET = 'LSP8IdentifiableDigitalAsset',
}

export interface DigitalAssetDeploymentOptions {
  controllerAddress: string;
  name: string;
  symbol: string;
  digitalAssetMetadata?: LSP4MetadataBeforeUpload | LSP4MetadataForEncoding | string;
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
  ipfsGateway?: IPFSGateway;
}

interface LSP7ContractDeploymentOptionsBase extends ContractDeploymentOptionsBase {
  LSP7DigitalAsset?: ContractOptions;
}

export interface LSP7ContractDeploymentOptionsReactive extends LSP7ContractDeploymentOptionsBase {
  deployReactive: true;
}

export interface LSP7ContractDeploymentOptionsNonReactive
  extends LSP7ContractDeploymentOptionsBase {
  deployReactive?: false;
}

export type LSP7ContractDeploymentOptions =
  | LSP7ContractDeploymentOptionsReactive
  | LSP7ContractDeploymentOptionsNonReactive;

interface LSP8ContractDeploymentOptionsBase extends ContractDeploymentOptionsBase {
  LSP8IdentifiableDigitalAsset?: ContractOptions;
}
export interface LSP8ContractDeploymentOptionsReactive extends LSP8ContractDeploymentOptionsBase {
  deployReactive: true;
}

export interface LSP8ContractDeploymentOptionsNonReactive
  extends LSP8ContractDeploymentOptionsBase {
  deployReactive?: false;
}

export type LSP8ContractDeploymentOptions =
  | LSP8ContractDeploymentOptionsReactive
  | LSP8ContractDeploymentOptionsNonReactive;

export type ContractDeploymentOptions =
  | LSP7ContractDeploymentOptions
  | LSP8ContractDeploymentOptions;

export interface DigitalAssetConfiguration {
  version?: string;
  byteCode?: string;
  libAddress?: string;
  deployProxy?: boolean;
  uploadOptions?: UploadOptions;
  deployReactive: boolean;
}
