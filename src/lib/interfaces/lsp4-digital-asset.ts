import {
  AssetMetadata,
  ImageMetadata,
  LinkMetadata,
  Verification,
} from './metadata';

export interface LSP4DigitalAssetJSON {
  LSP4Metadata: LSP4DigitalAsset;
}

export interface LSP4DigitalAsset {
  description: string;
  links: LinkMetadata[];
  images: ImageMetadata[][];
  assets: AssetMetadata[];
  icon: ImageMetadata[];
}

export interface LSP4MetadataUrlForEncoding {
  json: LSP4DigitalAssetJSON;
  url: string;
}

export interface HashedLSP4MetadataForEncoding {
  verification: Verification;
  url: string;
}

export type LSP4MetadataForEncoding = LSP4MetadataUrlForEncoding | HashedLSP4MetadataForEncoding;
