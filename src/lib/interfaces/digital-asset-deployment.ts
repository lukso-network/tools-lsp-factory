import { LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';

import {
  LSP4MetadataBeforeUpload,
  LSP4MetadataContentBeforeUpload,
  LSP4MetadataForEncoding,
} from './lsp4-digital-asset';
import { IPFSGateway, UploadOptions } from './profile-upload-options';

import { ContractOptions, DeployedContract, DeploymentEventCallbacks } from '.';

export enum ContractNames {
  LSP7_DIGITAL_ASSET = 'LSP7DigitalAsset',
  LSP8_DIGITAL_ASSET = 'LSP8IdentifiableDigitalAsset',
}

export type LSP4TokenTypeNames = keyof typeof LSP4_TOKEN_TYPES;
export type LSP4TokenTypeValues = (typeof LSP4_TOKEN_TYPES)[LSP4TokenTypeNames];

export interface DigitalAssetDeploymentOptions {
  controllerAddress: string;
  name: string;
  symbol: string;
  tokenType: LSP4TokenTypeNames | LSP4TokenTypeValues;
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

export interface LSP8IdentifiableDigitalAssetDeploymentOptions
  extends DigitalAssetDeploymentOptions {
  tokenIdType: number | string;
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
  uploadOptions?: UploadOptions;
}
