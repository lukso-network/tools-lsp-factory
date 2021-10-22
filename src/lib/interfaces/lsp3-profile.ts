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

export interface ProfileDataBeforeUpload {
  profileImage?: File | LSP3ProfileImage[];
  backgroundImage?: File | LSP3ProfileImage[];
  name: string;
  description: string;
  links?: LSP3ProfileLink[];
  tags?: string[];
}

export interface LSP3ProfileDataForEncoding {
  profile: LSP3ProfileJSON;
  url: string;
}
