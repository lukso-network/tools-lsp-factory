import { AssetMetadata, ImageBuffer, ImageMetadata, LinkMetadata } from './metadata';

export interface LSP3ProfileJSON {
  LSP3Profile: LSP3Profile;
}

export interface LSP3Profile {
  name: string;
  description: string;
  profileImage?: ImageMetadata[];
  backgroundImage?: ImageMetadata[];
  tags?: string[];
  links?: LinkMetadata[];
  avatar?: AssetMetadata[];
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
  profileImage?: File | ImageBuffer | ImageMetadata[];
  backgroundImage?: File | ImageBuffer | ImageMetadata[];
  name: string;
  description: string;
  links?: LinkMetadata[];
  tags?: string[];
  avatar?: (File | AssetMetadata)[];
}

export interface LSP3ProfileBeforeUpload {
  LSP3Profile: ProfileDataBeforeUpload;
}

export interface ProfileDataForEncoding {
  json: LSP3ProfileJSON;
  url: string;
}

export interface HashedProfileDataForEncoding {
  verificationFunction: string;
  verificationData: string;
  url: string;
}

export type LSP3ProfileDataForEncoding = ProfileDataForEncoding | HashedProfileDataForEncoding;
