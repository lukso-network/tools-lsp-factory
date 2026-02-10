import { zeroAddress, encodeFunctionData } from 'viem';

import {
  buildLSP23Args,
  buildSetDataParams,
  LSP23DeployParams,
  UP_INIT_ABI,
  KM_INIT_ABI,
} from './lsp23.helper';

describe('lsp23.helper', () => {
  const mockParams: LSP23DeployParams = {
    salt: '0x' + '00'.repeat(32) as `0x${string}`,
    upBaseContractAddress: '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F',
    kmBaseContractAddress: '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4',
    lsp23FactoryAddress: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
    upInitOwner: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  };

  describe('buildLSP23Args', () => {
    it('should return primary and secondary deployment init structs', () => {
      const result = buildLSP23Args(mockParams);

      expect(result.primaryContractDeploymentInit).toBeDefined();
      expect(result.secondaryContractDeploymentInit).toBeDefined();
      expect(result.postDeploymentModule).toBe(zeroAddress);
      expect(result.postDeploymentModuleCalldata).toBe('0x');
    });

    it('should set primary contract to UP base address', () => {
      const result = buildLSP23Args(mockParams);
      expect(result.primaryContractDeploymentInit.implementationContract).toBe(
        mockParams.upBaseContractAddress
      );
    });

    it('should set secondary contract to KM base address', () => {
      const result = buildLSP23Args(mockParams);
      expect(result.secondaryContractDeploymentInit.implementationContract).toBe(
        mockParams.kmBaseContractAddress
      );
    });

    it('should set addPrimaryContractAddress to true for secondary', () => {
      const result = buildLSP23Args(mockParams);
      expect(result.secondaryContractDeploymentInit.addPrimaryContractAddress).toBe(true);
    });

    it('should use the provided salt', () => {
      const customSalt = '0x' + 'ab'.repeat(32) as `0x${string}`;
      const result = buildLSP23Args({ ...mockParams, salt: customSalt });
      expect(result.primaryContractDeploymentInit.salt).toBe(customSalt);
    });

    it('should set funding amounts to 0', () => {
      const result = buildLSP23Args(mockParams);
      expect(result.primaryContractDeploymentInit.fundingAmount).toBe(0n);
      expect(result.secondaryContractDeploymentInit.fundingAmount).toBe(0n);
    });

    it('should encode UP initialize calldata with upInitOwner', () => {
      const result = buildLSP23Args(mockParams);
      const expectedCalldata = encodeFunctionData({
        abi: UP_INIT_ABI,
        functionName: 'initialize',
        args: [mockParams.upInitOwner],
      });
      expect(result.primaryContractDeploymentInit.initializationCalldata).toBe(expectedCalldata);
    });

    it('should encode KM initialize calldata with zero address placeholder', () => {
      const result = buildLSP23Args(mockParams);
      const expectedCalldata = encodeFunctionData({
        abi: KM_INIT_ABI,
        functionName: 'initialize',
        args: [zeroAddress],
      });
      expect(result.secondaryContractDeploymentInit.initializationCalldata).toBe(expectedCalldata);
    });
  });

  describe('buildSetDataParams', () => {
    const controller1 = '0x1111111111111111111111111111111111111111' as `0x${string}`;
    const urdAddress = '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D' as `0x${string}`;
    const signerAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`;

    it('should return keysToSet and valuesToSet arrays', () => {
      const result = buildSetDataParams([controller1], urdAddress, signerAddress);
      expect(result.keysToSet).toBeInstanceOf(Array);
      expect(result.valuesToSet).toBeInstanceOf(Array);
      expect(result.keysToSet.length).toBe(result.valuesToSet.length);
    });

    it('should include URD address in keysToSet', () => {
      const result = buildSetDataParams([controller1], urdAddress, signerAddress);
      // Should contain the LSP1UniversalReceiverDelegate key
      expect(result.keysToSet.some((key) => key.startsWith('0x0cfc51aec37c55a4d0b1a65c6255c4bf'))).toBe(true);
    });

    it('should include signer permissions when signer is not a controller', () => {
      const result = buildSetDataParams([controller1], urdAddress, signerAddress);
      // Signer gets CHANGEOWNER + EDITPERMISSIONS added separately
      const signerPermKey = result.keysToSet.find((key) =>
        key.toLowerCase().includes(signerAddress.substring(2).toLowerCase())
      );
      expect(signerPermKey).toBeDefined();
    });

    it('should handle controller as ControllerOptions object', () => {
      const controllerOpts = {
        address: controller1,
        permissions: '0x0000000000000000000000000000000000000000000000000000000000000010' as `0x${string}`,
      };
      const result = buildSetDataParams([controllerOpts], urdAddress, signerAddress);
      expect(result.keysToSet.length).toBeGreaterThan(0);
      expect(result.valuesToSet.length).toBeGreaterThan(0);
    });

    it('should include LSP3 data when provided', () => {
      const lsp3Data = '0xdeadbeef' as `0x${string}`;
      const result = buildSetDataParams([controller1], urdAddress, signerAddress, lsp3Data);
      expect(result.valuesToSet).toContain(lsp3Data);
    });

    it('should not include LSP3 data when not provided', () => {
      const result = buildSetDataParams([controller1], urdAddress, signerAddress);
      const lsp3Key = '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5';
      expect(result.keysToSet).not.toContain(lsp3Key);
    });
  });
});
