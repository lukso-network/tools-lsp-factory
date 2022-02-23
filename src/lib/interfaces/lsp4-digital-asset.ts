import { Asset, AssetBuffer, Image, ImageBuffer, Link } from './metadata';

export interface LSP4DigitalAssetJSON {
  LSP4Metadata: LSP4DigitalAsset;
}

export interface LSP4DigitalAsset {
  description: string;
  links: Link[];
  images: Image[][];
  assets: Asset[];
  icon: Image[];
}

export interface LSP4MetadataBeforeUpload {
  description: string;
  links?: Link[];
  icon?: File | ImageBuffer | Image[];
  images?: (File | ImageBuffer | Image[])[];
  assets?: (File | AssetBuffer | Asset)[];
}

export interface LSP4MetadataForEncoding {
  lsp4Metadata: LSP4DigitalAssetJSON;
  url: string;
}
