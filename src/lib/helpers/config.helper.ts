import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
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

export const LSP3_UP_KEYS = {
  UNIVERSAL_RECEIVER_DELEGATE_KEY: keccak256(toUtf8Bytes('LSP1UniversalReceiverDelegate')),
  LSP3_PROFILE: keccak256(toUtf8Bytes('LSP1UniversalReceiverDelegate')),
};

export const PREFIX_PERMISSIONS = '0x4b80742d0000000082ac0000';
export const ALL_PERMISSIONS = '0xff';
