export interface LSP3ProfileJSON {
  LSP3Profile: LSP3Profile;
}

export interface LSP3Profile {
  name: string;
  description: string;
  profileImage?: LSP3ProfileImage[];
  backgroundImage?: LSP3ProfileImage[];
  tags?: string[];
  links?: LSP3ProfileLink[];
}

export interface LSP3ProfileLink {
  title: string;
  url: string;
}

export interface LSP3ProfileImage {
  width: number;
  height: number;
  hashFunction: string;
  hash: string;
  url: string;
}

/**
 * @example
 *```javascript
 *{
 *  name: "My Universal Profile",
 *  description: "My cool Universal Profile",
 *  profileImage: myLocalFile,
 *  backgroundImage: myLocalFile,
 *  tags: ['Fashion', 'Design'],
 *  links: [{ title: "My Website", url: "www.my-website.com" }],
 *};
 *```
 */
export interface ProfileDataBeforeUpload {
  profileImage?: File | ImageBuffer | LSP3ProfileImage[];
  backgroundImage?: File | ImageBuffer | LSP3ProfileImage[];
  name: string;
  description: string;
  links?: LSP3ProfileLink[];
  tags?: string[];
}

export interface LSP3ProfileDataForEncoding {
  profile: LSP3ProfileJSON;
  url: string;
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
