import { ERC725, Erc725Schema } from 'erc725.js';
import { solidityKeccak256 } from 'ethers/lib/utils';
import { LSP3ProfileJSON } from '../interfaces';

export function getERC725(address?: string, provider?: any) {
  const schema: Erc725Schema[] = [
    {
      name: 'LSP3Profile',
      key: '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
      keyType: 'Singleton',
      valueContent: 'JSONURL',
      valueType: 'bytes',
    },
  ];

  if (address) {
    return new ERC725(schema, address, provider);
  }

  return new ERC725(schema);
}

export function encodeLSP3Profile(lsp3ProfileJson: LSP3ProfileJSON, url: string) {
  const myERC725 = getERC725();
  return myERC725.encodeData('LSP3Profile', {
    hashFunction: 'keccak256(utf8)',
    hash: solidityKeccak256(['string'], [JSON.stringify(lsp3ProfileJson)]),
    url,
  });
}
