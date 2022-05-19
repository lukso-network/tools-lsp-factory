import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { Options } from 'ipfs-http-client';

import { UploadOptions } from '../interfaces/profile-upload-options';

const defaultIpfsClientOptions: Options = {
  host: 'api.2eff.lukso.dev',
  port: 443,
  protocol: 'https',
};

export const defaultUploadOptions: UploadOptions = {
  ipfsClientOptions: defaultIpfsClientOptions,
};

export const ERC725_ACCOUNT_INTERRFACE = '0x63cb749b';

export const LSP3_UP_KEYS = {
  UNIVERSAL_RECEIVER_DELEGATE_KEY: keccak256(toUtf8Bytes('LSP1UniversalReceiverDelegate')),
  LSP3_PROFILE: keccak256(toUtf8Bytes('LSP3Profile')),
};

export const LSP4_KEYS = {
  LSP4_METADATA: keccak256(toUtf8Bytes('LSP4Metadata')),
  LSP4_CREATORS_ARRAY: keccak256(toUtf8Bytes('LSP4Creators[]')),
  LSP4_CREATORS_MAP_PREFIX: '0x6de85eaf5d982b4e00000000',
};

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

export const ADDRESS_PERMISSIONS_ARRAY_KEY =
  '0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3';

export const PREFIX_PERMISSIONS = '0x4b80742d0000000082ac0000';

// exclude DELEGATECALL for safety
export const DEFAULT_PERMISSIONS = {
  CHANGEOWNER: true,
  CHANGEPERMISSIONS: true,
  ADDPERMISSIONS: true,
  SETDATA: true,
  CALL: true,
  STATICCALL: true,
  DELEGATECALL: false,
  DEPLOY: true,
  TRANSFERVALUE: true,
  SIGN: true,
};

export const DEFAULT_CONTRACT_VERSION = '0.5.0';

export const GAS_PRICE = 10_000_000_000;
export const GAS_BUFFER = 100_000;
