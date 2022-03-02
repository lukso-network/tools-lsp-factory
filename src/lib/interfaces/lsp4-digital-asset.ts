import { AssetBuffer, AssetMetadata, ImageBuffer, ImageMetadata, LinkMetdata } from './metadata';

export interface LSP4DigitalAssetJSON {
  LSP4Metadata: LSP4DigitalAsset;
}

export interface LSP4DigitalAsset {
  description: string;
  links: LinkMetdata[];
  images: ImageMetadata[][];
  assets: AssetMetadata[];
  icon: ImageMetadata[];
}

export interface LSP4MetadataBeforeUpload {
  description: string;
  links?: LinkMetdata[];
  icon?: File | ImageBuffer | ImageMetadata[];
  images?: (File | ImageBuffer | ImageMetadata[])[];
  assets?: (File | AssetBuffer | AssetMetadata)[];
}

export interface LSP4MetadataForEncoding {
  lsp4Metadata: LSP4DigitalAssetJSON;
  url: string;
}
