import { Hex } from 'viem';
import { LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';

import { ContractOptions } from './contract-options';
import { DeployedContract, DeploymentEventCallbacks } from './deployment-events';
import {
  LSP4MetadataForEncoding,
} from './lsp4-digital-asset';

export enum ContractNames {
  LSP7_DIGITAL_ASSET = 'LSP7DigitalAsset',
  LSP8_DIGITAL_ASSET = 'LSP8IdentifiableDigitalAsset',
}

export type LSP4TokenTypeNames = keyof typeof LSP4_TOKEN_TYPES;
export type LSP4TokenTypeValues = (typeof LSP4_TOKEN_TYPES)[LSP4TokenTypeNames];

export interface DigitalAssetDeploymentOptions {
  controllerAddress: Hex;
  name: string;
  symbol: string;
  tokenType: LSP4TokenTypeNames | LSP4TokenTypeValues;
  digitalAssetMetadata?: LSP4MetadataForEncoding | string;
  creators?: Hex[];
}

export interface LSP7DigitalAssetDeploymentOptions extends DigitalAssetDeploymentOptions {
  isNFT: boolean;
}

export interface LSP8IdentifiableDigitalAssetDeploymentOptions
  extends DigitalAssetDeploymentOptions {
  tokenIdFormat: number | string;
}

export interface DeployedLSP8IdentifiableDigitalAsset {
  LSP8IdentifiableDigitalAsset: DeployedContract;
}

export interface DeployedLSP7DigitalAsset {
  LSP7DigitalAsset: DeployedContract;
}

export interface LSP7ContractDeploymentOptions {
  LSP7DigitalAsset?: ContractOptions;
  onDeployEvents?: DeploymentEventCallbacks<DeployedLSP7DigitalAsset>;
}

export interface LSP8ContractDeploymentOptions {
  LSP8IdentifiableDigitalAsset?: ContractOptions;
  onDeployEvents?: DeploymentEventCallbacks<DeployedLSP8IdentifiableDigitalAsset>;
}

export type DigitalAssetContractDeploymentOptions =
  | LSP7ContractDeploymentOptions
  | LSP8ContractDeploymentOptions;

export interface DigitalAssetConfiguration {
  version?: string;
  byteCode?: Hex;
  libAddress?: Hex;
  deployProxy?: boolean;
}
