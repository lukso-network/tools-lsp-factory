import { Permissions } from '@erc725/erc725.js/build/main/src/types/Method';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { version as lspSmartContractsVersion } from '@lukso/lsp-smart-contracts/package.json';

// const defaultIpfsGateway: Options = {
//   host: 'api.2eff.lukso.dev',
//   port: 443,
//   protocol: 'https',
// };

export const LSP3_UP_KEYS = {
  UNIVERSAL_RECEIVER_DELEGATE_KEY: keccak256(toUtf8Bytes('LSP1UniversalReceiverDelegate')),
  LSP3_PROFILE: keccak256(toUtf8Bytes('LSP3Profile')),
};

export const LSP4_KEYS = {
  LSP4_METADATA: keccak256(toUtf8Bytes('LSP4Metadata')),
  LSP4_CREATORS_ARRAY: keccak256(toUtf8Bytes('LSP4Creators[]')),
  LSP4_CREATORS_MAP_PREFIX: '0x6de85eaf5d982b4e5da00000',
};

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

export const ADDRESS_PERMISSIONS_ARRAY_KEY =
  '0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3';

export const PREFIX_PERMISSIONS = '0x4b80742de2bf82acb3630000';

// exclude DELEGATECALL for safety
export const DEFAULT_PERMISSIONS: Permissions = {
  CHANGEOWNER: true,
  EDITPERMISSIONS: true,
  ADDCONTROLLER: true,
  SETDATA: true,
  CALL: true,
  STATICCALL: true,
  DELEGATECALL: false,
  DEPLOY: true,
  TRANSFERVALUE: true,
  SIGN: true,
  SUPER_CALL: true,
  SUPER_DELEGATECALL: false,
  SUPER_SETDATA: true,
  SUPER_STATICCALL: true,
  SUPER_TRANSFERVALUE: true,
  ENCRYPT: true,
  ADDEXTENSIONS: true,
  ADDUNIVERSALRECEIVERDELEGATE: true,
  CHANGEEXTENSIONS: true,
  CHANGEUNIVERSALRECEIVERDELEGATE: true,
  DECRYPT: true,
  REENTRANCY: true,
};

export const DEFAULT_CONTRACT_VERSION = lspSmartContractsVersion;

export const GAS_PRICE = 10_000_000_000;
export const GAS_BUFFER = 100_000;
