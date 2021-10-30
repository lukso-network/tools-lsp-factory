import { LSP7 } from '../../tmp/LSP7';
import { LSP8 } from '../../tmp/LSP8';

export enum ContractNames {
  LSP7_DIGITAL_ASSET = 'LSP7DigitalAsset',
  LSP8_DIGITAL_ASSET = 'LSP8IdentifiableDigitalAsset',
}

export interface DigitalAssetDeploymentOptions {
  ownerAddress: string;
  name: string;
  symbol: string;
}

export interface LSP7DigitalAssetDeploymentOptions extends DigitalAssetDeploymentOptions {
  isNFT: boolean;
}

export enum DeploymentStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
}

export interface DeployedContracts {
  LSP7DigitalAsset: LSP7;
  LSP8IdentifiableDigitalAsset: LSP8;
}
