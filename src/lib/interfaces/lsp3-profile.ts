import { Asset, Image, ImageBuffer, Link } from './metadata';

export interface LSP3ProfileJSON {
  LSP3Profile: LSP3Profile;
}

export interface LSP3Profile {
  name: string;
  description: string;
  profileImage?: Image[];
  backgroundImage?: Image[];
  tags?: string[];
  links?: Link[];
  avatar?: Asset[];
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
  profileImage?: File | ImageBuffer | Image[];
  backgroundImage?: File | ImageBuffer | Image[];
  name: string;
  description: string;
  links?: Link[];
  tags?: string[];
}

export interface LSP3ProfileDataForEncoding {
  profile: LSP3ProfileJSON;
  url: string;
}
