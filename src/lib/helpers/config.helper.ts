import { version as lspSmartContractsVersion } from '@lukso/lsp-smart-contracts/package.json';
import { Options } from 'ipfs-http-client';

import { UploadOptions } from '../interfaces/profile-upload-options';

const defaultIpfsGateway: Options = {
  host: 'api.2eff.lukso.dev',
  port: 443,
  protocol: 'https',
};

export const defaultUploadOptions: UploadOptions = {
  ipfsGateway: defaultIpfsGateway,
};

export const DEFAULT_CONTRACT_VERSION = lspSmartContractsVersion;

// TODO: add this constant inside the `@lukso/lsp-smart-contracts` package
export const JSONURL_KNOWN_HASH_FUNCTIONS = {
  'keccak256(utf8)': '0x6f357c6a',
};

export const GAS_PRICE = 10_000_000_000;
export const GAS_BUFFER = 100_000;
