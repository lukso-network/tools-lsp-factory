import { getERC725, erc725EncodeData, schema } from '../src/lib/helpers/erc725.helper';

describe('erc725.helper', () => {
  describe('getERC725', () => {
    it('should return an ERC725 instance', () => {
      const instance = getERC725();
      expect(instance).toBeDefined();
      expect(typeof instance.encodeData).toBe('function');
    });
  });

  describe('erc725EncodeData', () => {
    it('should encode LSP4Metadata with a hashed verification', () => {
      const metadata = {
        verification: {
          method: 'keccak256(utf8)',
          data: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
        url: 'ipfs://QmTest123',
      };

      const result = erc725EncodeData(metadata, 'LSP4Metadata');

      expect(result.keys).toBeDefined();
      expect(result.values).toBeDefined();
      expect(result.keys.length).toBe(1);
      expect(result.values.length).toBe(1);
      expect(result.values[0]).toMatch(/^0x/);
    });

    it('should encode LSP3Profile with a hashed verification', () => {
      const metadata = {
        verification: {
          method: 'keccak256(utf8)',
          data: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        },
        url: 'ipfs://QmProfile456',
      };

      const result = erc725EncodeData(metadata, 'LSP3Profile');

      expect(result.keys).toBeDefined();
      expect(result.values).toBeDefined();
      expect(result.keys.length).toBe(1);
      expect(result.values[0]).toMatch(/^0x/);
    });
  });

  describe('schema', () => {
    it('should export LSP3Profile and LSP4Metadata schemas', () => {
      expect(schema).toHaveLength(2);
      expect(schema[0].name).toBe('LSP3Profile');
      expect(schema[1].name).toBe('LSP4Metadata');
    });
  });
});
