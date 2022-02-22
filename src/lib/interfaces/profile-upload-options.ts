import { Options } from 'ipfs-http-client';

export interface UploadOptionsHTTP {
  url: string;
  port?: number;
  ipfsClientOptions?: never;
}

export interface UploadOptionsIPFS {
  url?: never;
  port?: never;
  ipfsClientOptions: Options;
}

export type UploadOptions = UploadOptionsHTTP | UploadOptionsIPFS;
