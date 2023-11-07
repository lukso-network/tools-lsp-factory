import { Options } from 'ipfs-http-client';

export interface UploadOptionsHTTP {
  url: string;
  port?: number;
  ipfsGateway?: never;
}

export interface UploadOptionsIPFS {
  url?: never;
  port?: never;
  ipfsGateway?: IPFSGateway;
}

export type IPFSGateway = Options | string;

export type UploadOptions = UploadOptionsHTTP | UploadOptionsIPFS;
