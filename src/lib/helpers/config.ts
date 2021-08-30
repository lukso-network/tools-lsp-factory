import { Options } from 'ipfs-http-client';

import { ProfileUploadOptions } from '../interfaces/profile-upload-options';

const defaultIpfsClientOptions: Options = {
  host: 'api.ipfs.lukso.network',
  port: 443,
  protocol: 'https',
};

export const defaultUploadOptions: ProfileUploadOptions = {
  ipfsClientOptions: defaultIpfsClientOptions,
};
