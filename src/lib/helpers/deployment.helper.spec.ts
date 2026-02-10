import { isAddress, getProxyByteCode, convertContractDeploymentOptionsVersion } from './deployment.helper';

describe('deployment.helper', () => {
  describe('isAddress', () => {
    it('should return true for a valid checksummed address', () => {
      expect(isAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(true);
    });

    it('should return true for a valid lowercase address', () => {
      expect(isAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(true);
    });

    it('should return false for an invalid address', () => {
      expect(isAddress('0xinvalid')).toBe(false);
    });

    it('should return false for a non-hex string', () => {
      expect(isAddress('hello world')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isAddress('')).toBe(false);
    });
  });

  describe('getProxyByteCode', () => {
    it('should return EIP-1167 minimal proxy bytecode for a given address', () => {
      const address = '0x1234567890AbcDef1234567890AbCdEf12345678';
      const result = getProxyByteCode(address);

      expect(result).toContain('1234567890AbcDef1234567890AbCdEf12345678');
      expect(result.startsWith('0x3d602d80600a3d3981f3363d3d373d3d3d363d73')).toBe(true);
      expect(result.endsWith('5af43d82803e903d91602b57fd5bf3')).toBe(true);
    });
  });

  describe('convertContractDeploymentOptionsVersion', () => {
    it('should return version string for non-hex input', () => {
      const result = convertContractDeploymentOptionsVersion('0.14.0');
      expect(result).toEqual({ version: '0.14.0', byteCode: undefined, libAddress: undefined });
    });

    it('should return libAddress for a valid 0x-prefixed address', () => {
      const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      const result = convertContractDeploymentOptionsVersion(address);
      expect(result).toEqual({ version: undefined, byteCode: undefined, libAddress: address });
    });

    it('should return byteCode for a 0x-prefixed non-address hex', () => {
      const bytecode = '0x6080604052';
      const result = convertContractDeploymentOptionsVersion(bytecode);
      expect(result).toEqual({ version: undefined, byteCode: bytecode, libAddress: undefined });
    });

    it('should return all undefined when no version provided', () => {
      const result = convertContractDeploymentOptionsVersion();
      expect(result).toEqual({ version: undefined, byteCode: undefined, libAddress: undefined });
    });
  });
});
