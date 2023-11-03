export interface ImageMetadata {
  width: number;
  height: number;
  verificationFunction: string;
  verificationData: string;
  url: string;
}

export interface LinkMetadata {
  title: string;
  url: string;
}

export interface AssetMetadata {
  verificationFunction: string;
  verificationData: string;
  url: string;
  fileType: string;
}

export interface ImageBuffer {
  buffer: Buffer;
  mimeType: SupportedImageBufferFormats;
}

export enum SupportedImageBufferFormats {
  MIME_PNG = 'image/png',
  MIME_BMP = 'image/bmp',
  MIME_JPEG = 'image/jpeg',
  MIME_GIF = 'image/gif',
}

export interface AssetBuffer {
  buffer: Buffer;
  mimeType: string;
}
