export interface ImageMetadata {
  width: number;
  height: number;
  verification: Verification;
  url: string;
}

export interface LinkMetadata {
  title: string;
  url: string;
}

export interface AssetMetadata {
  verification: Verification;
  url: string;
  fileType: string;
}

export interface Verification {
  method: string;
  data: string;
  source?: string;
}
