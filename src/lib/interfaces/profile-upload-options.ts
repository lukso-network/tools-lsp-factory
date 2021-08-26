import { Options } from 'ipfs-http-client';

export interface ProfileUploadOptionsHTTP {
  url: string;
  port: number;
  ipfsClientOptions?: never;
}

export interface ProfileUploadOptionsIPFS {
  url?: never;
  port?: never;
  ipfsClientOptions: Options;
}

export type ProfileUploadOptions = ProfileUploadOptionsHTTP | ProfileUploadOptionsIPFS;
