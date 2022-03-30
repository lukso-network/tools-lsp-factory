import { AssetMetadata, ImageBuffer, ImageMetadata, LinkMetdata } from './metadata';

export interface LSP3ProfileJSON {
  LSP3Profile: LSP3Profile;
}

export interface LSP3Profile {
  name: string;
  description: string;
  profileImage?: ImageMetadata[];
  backgroundImage?: ImageMetadata[];
  tags?: string[];
  links?: LinkMetdata[];
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
  links?: LinkMetdata[];
  tags?: string[];
}

export interface ProfileDataForEncoding {
  json: LSP3ProfileJSON;
  url: string;
}

export interface HashedProfileDataForEncoding {
  hashFunction: string;
  hash: string;
  url: string;
}

export type LSP3ProfileDataForEncoding = ProfileDataForEncoding | HashedProfileDataForEncoding;
