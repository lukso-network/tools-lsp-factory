export interface Image {
  width: number;
  height: number;
  hashFunction: string;
  hash: string;
  url: string;
}

export interface Link {
  title: string;
  url: string;
}

export interface Asset {
  hashFunction: string;
  hash: string;
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
