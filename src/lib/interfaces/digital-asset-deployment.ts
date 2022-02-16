import { DeployedContract } from '.';

export enum ContractNames {
  LSP7_DIGITAL_ASSET = 'LSP7DigitalAsset',
  LSP8_DIGITAL_ASSET = 'LSP8IdentifiableDigitalAsset',
}

export interface DigitalAssetDeploymentOptions {
  controllerAddress: string;
  name: string;
  symbol: string;
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

export interface ContractDeploymentOptions {
  version?: string;
  byteCode?: string;
  libAddress?: string;
  deployReactive?: boolean;
  deployProxy?: boolean;
}
