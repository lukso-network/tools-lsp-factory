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
  LSP3_PROFILE: keccak256(toUtf8Bytes('LSP3Profile')),
};

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

export const ADDRESS_PERMISSIONS_ARRAY_KEY =
  '0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3';

export const PREFIX_PERMISSIONS = '0x4b80742d0000000082ac0000';
export const ALL_PERMISSIONS = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
export const SET_DATA_PERMISSION =
  '0x0000000000000000000000000000000000000000000000000000000000000004';

export const DEFAULT_CONTRACT_VERSION = '0.0.1';

export const GAS_PRICE = 10_000_000_000;
