import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import { providers } from 'ethers';

import { LSP3ProfileDataForEncoding } from '../interfaces/lsp3-profile';
import { LSP4MetadataForEncoding } from '../interfaces/lsp4-digital-asset';

export const schema: ERC725JSONSchema[] = [
  {
    name: 'LSP3Profile',
    key: '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
    keyType: 'Singleton',
    valueContent: 'JSONURL',
    valueType: 'bytes',
  },
  {
    name: 'LSP4Metadata',
    key: '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e',
    keyType: 'Singleton',
    valueType: 'bytes',
    valueContent: 'JSONURL',
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
