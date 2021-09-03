import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';

import { LSP3ProfileJSON } from '../interfaces';

export const schema: ERC725JSONSchema[] = [
  {
    name: 'LSP3Profile',
    key: '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
    keyType: 'Singleton',
    valueContent: 'JSONURL',
    valueType: 'bytes',
  },
];

export function getERC725(address?: string, provider?: any) {
  if (address) {
    return new ERC725(schema, address, provider);
  }

  return new ERC725(schema);
}

export function encodeLSP3Profile(lsp3ProfileJson: LSP3ProfileJSON, url: string) {
  const myERC725 = getERC725();
  return myERC725.encodeData({
    LSP3Profile: {
      json: lsp3ProfileJson,
      url,
    },
  });
}
