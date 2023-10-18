import { Permissions } from '@erc725/erc725.js/build/main/src/types/Method';
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

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

export const DEFAULT_CONTRACT_VERSION = lspSmartContractsVersion;

export const GAS_PRICE = 10_000_000_000;
export const GAS_BUFFER = 100_000;
