import { LSP7, LSP8 } from '../../';

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

export interface DeployedContracts {
  LSP7DigitalAsset: LSP7;
  LSP8IdentifiableDigitalAsset: LSP8;
}

export interface ContractDeploymentOptions {
  version?: string;
  byteCode?: string;
  libAddress?: string;
}
