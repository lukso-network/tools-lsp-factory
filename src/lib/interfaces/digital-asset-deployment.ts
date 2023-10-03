import {
  LSP4MetadataBeforeUpload,
  LSP4MetadataContentBeforeUpload,
  LSP4MetadataForEncoding,
} from './lsp4-digital-asset';
import { UploadProvider } from './profile-upload-options';

import { ContractOptions, DeployedContract, DeploymentEventCallbacks } from '.';

export enum ContractNames {
  LSP7_DIGITAL_ASSET = 'LSP7DigitalAsset',
  LSP8_DIGITAL_ASSET = 'LSP8IdentifiableDigitalAsset',
}

export interface DigitalAssetDeploymentOptions {
  controllerAddress: string;
  name: string;
  symbol: string;
  digitalAssetMetadata?:
    | LSP4MetadataBeforeUpload
    | LSP4MetadataContentBeforeUpload
    | LSP4MetadataForEncoding
    | string;
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
  uploadProvider?: UploadProvider;
}

export interface LSP7ContractDeploymentOptions extends ContractDeploymentOptionsBase {
  LSP7DigitalAsset?: ContractOptions;
  onDeployEvents?: DeploymentEventCallbacks<DeployedLSP7DigitalAsset>;
}

export interface LSP8ContractDeploymentOptions extends ContractDeploymentOptionsBase {
  LSP8IdentifiableDigitalAsset?: ContractOptions;
  onDeployEvents?: DeploymentEventCallbacks<DeployedLSP8IdentifiableDigitalAsset>;
}

export type DigitalAssetContractDeploymentOptions =
  | LSP7ContractDeploymentOptions
  | LSP8ContractDeploymentOptions;

export interface DigitalAssetConfiguration {
  version?: string;
  byteCode?: string;
  libAddress?: string;
  deployProxy?: boolean;
  uploadProvider?: UploadProvider;
}
