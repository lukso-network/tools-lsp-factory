import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { providers } from 'ethers';

import { LSP3ProfileDataForEncoding } from '../interfaces/lsp3-profile';
import { LSP4MetadataForEncoding } from '../interfaces/lsp4-digital-asset';

export const schema: ERC725JSONSchema[] = [
  {
    name: 'LSP3Profile',
    key: ERC725YDataKeys.LSP3.LSP3Profile,
    keyType: 'Singleton',
    valueType: 'bytes',
    valueContent: 'VerifiableURI',
  },
  {
    name: 'LSP4Metadata',
    key: ERC725YDataKeys.LSP4.LSP4Metadata,
    keyType: 'Singleton',
    valueType: 'bytes',
    valueContent: 'VerifiableURI',
  },
];

export function getERC725(address?: string, provider?: providers.Web3Provider) {
  if (address) {
    return new ERC725(schema, address, provider);
  }

  return new ERC725(schema);
}

export function erc725EncodeData(
  data: LSP4MetadataForEncoding | LSP3ProfileDataForEncoding,
  keyName: string
) {
  const myERC725 = getERC725();
  return myERC725.encodeData([{ keyName, value: data }]);
}
