import { ERC725, Erc725Schema } from 'erc725.js';

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
