import { AssetBuffer, AssetMetadata, ImageBuffer, ImageMetadata, LinkMetadata } from './metadata';

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

export interface LSP4MetadataContentBeforeUpload {
  description: string;
  links?: LinkMetadata[];
  icon?: File | ImageBuffer | ImageMetadata[];
  images?: (File | ImageBuffer | ImageMetadata[])[];
  assets?: (File | AssetBuffer | AssetMetadata)[];
}

export interface LSP4MetadataBeforeUpload {
  LSP4Metadata: LSP4MetadataContentBeforeUpload;
}

export interface LSP4MetadataUrlForEncoding {
  json: LSP4DigitalAssetJSON;
  url: string;
}

export interface HashedLSP4MetadataForEncoding {
  hashFunction: string;
  hash: string;
  url: string;
}

export type LSP4MetadataForEncoding = LSP4MetadataUrlForEncoding | HashedLSP4MetadataForEncoding;
