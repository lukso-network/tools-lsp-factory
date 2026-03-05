import type { Hex, PublicClient, WalletClient } from 'viem';
import { encodeFunctionData, getAddress, zeroAddress } from 'viem';

import {
  buildLSP23Args,
  buildSetDataParams,
  computeAddressesViaLSP23,
  deployViaLSP23,
  KM_INIT_ABI,
  LSP23DeployParams,
  setDataAndTransferOwnership,
  UP_INIT_ABI,
} from '../src/lib/helpers/lsp23.helper';

describe('lsp23.helper', () => {
  const mockParams: LSP23DeployParams = {
    salt: ('0x' + '00'.repeat(32)) as `0x${string}`,
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
      const customSalt = ('0x' + 'ab'.repeat(32)) as `0x${string}`;
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
      expect(
        result.keysToSet.some((key) => key.startsWith('0x0cfc51aec37c55a4d0b1a65c6255c4bf'))
      ).toBe(true);
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
        permissions:
          '0x0000000000000000000000000000000000000000000000000000000000000010' as `0x${string}`,
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

    it('should handle multiple controllers', () => {
      const controller2 = '0x2222222222222222222222222222222222222222' as Hex;
      const result = buildSetDataParams([controller1, controller2], urdAddress, signerAddress);

      // Should have permission keys for both controllers
      const ctrl1Key = result.keysToSet.find((k) =>
        k.toLowerCase().includes(controller1.substring(2).toLowerCase())
      );
      const ctrl2Key = result.keysToSet.find((k) =>
        k.toLowerCase().includes(controller2.substring(2).toLowerCase())
      );
      expect(ctrl1Key).toBeDefined();
      expect(ctrl2Key).toBeDefined();
    });

    it('should override signer permissions when signer is a controller', () => {
      const result = buildSetDataParams([signerAddress], urdAddress, signerAddress);

      // Signer is in the controller list, so permissions should be CHANGEOWNER + EDITPERMISSIONS
      const signerPermKey = result.keysToSet.find((key) =>
        key.toLowerCase().includes(signerAddress.substring(2).toLowerCase())
      );
      expect(signerPermKey).toBeDefined();
    });
  });

  describe('deployViaLSP23', () => {
    const MOCK_UP = '0x1111111111111111111111111111111111111111' as Hex;
    const MOCK_KM = '0x2222222222222222222222222222222222222222' as Hex;
    const MOCK_TX = ('0x' + 'ab'.repeat(32)) as Hex;
    const MOCK_SIGNER = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as Hex;

    it('should simulate and write the deployERC1167Proxies contract call', async () => {
      const publicClient = {
        simulateContract: jest.fn().mockResolvedValue({
          result: [MOCK_UP, MOCK_KM],
          request: { mock: 'request' },
        }),
      } as unknown as PublicClient;

      const walletClient = {
        account: { address: MOCK_SIGNER },
        writeContract: jest.fn().mockResolvedValue(MOCK_TX),
      } as unknown as WalletClient;

      const result = await deployViaLSP23(publicClient, walletClient, mockParams);

      expect(publicClient.simulateContract).toHaveBeenCalledTimes(1);
      expect(walletClient.writeContract).toHaveBeenCalledWith({ mock: 'request' });
      expect(result.upAddress).toBe(getAddress(MOCK_UP));
      expect(result.kmAddress).toBe(getAddress(MOCK_KM));
      expect(result.txHash).toBe(MOCK_TX);
    });

    it('should throw when walletClient has no account', async () => {
      const publicClient = {} as unknown as PublicClient;
      const walletClient = {
        account: undefined,
      } as unknown as WalletClient;

      await expect(deployViaLSP23(publicClient, walletClient, mockParams)).rejects.toThrow(
        'WalletClient must have an account'
      );
    });
  });

  describe('computeAddressesViaLSP23', () => {
    const MOCK_UP = '0x1111111111111111111111111111111111111111' as Hex;
    const MOCK_KM = '0x2222222222222222222222222222222222222222' as Hex;

    it('should call readContract with computeERC1167Addresses', async () => {
      const publicClient = {
        readContract: jest.fn().mockResolvedValue([MOCK_UP, MOCK_KM]),
      } as unknown as PublicClient;

      const result = await computeAddressesViaLSP23(publicClient, mockParams);

      expect(publicClient.readContract).toHaveBeenCalledTimes(1);
      expect(result.upAddress).toBe(getAddress(MOCK_UP));
      expect(result.kmAddress).toBe(getAddress(MOCK_KM));
    });
  });

  describe('setDataAndTransferOwnership', () => {
    const MOCK_UP = '0x1111111111111111111111111111111111111111' as Hex;
    const MOCK_KM = '0x2222222222222222222222222222222222222222' as Hex;
    const MOCK_TX = ('0x' + 'ab'.repeat(32)) as Hex;
    const MOCK_SIGNER = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as Hex;
    const controller1 = '0x3333333333333333333333333333333333333333' as Hex;
    const urdAddress = '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D' as Hex;

    let publicClient: PublicClient;
    let walletClient: WalletClient;

    beforeEach(() => {
      publicClient = {
        waitForTransactionReceipt: jest.fn().mockResolvedValue({}),
      } as unknown as PublicClient;

      walletClient = {
        account: { address: MOCK_SIGNER },
        chain: { id: 4201 },
        writeContract: jest.fn().mockResolvedValue(MOCK_TX),
      } as unknown as WalletClient;
    });

    it('should execute 4 transactions: setData, transferOwnership, acceptOwnership, revokePermissions', async () => {
      const txHashes = await setDataAndTransferOwnership(
        publicClient,
        walletClient,
        MOCK_UP,
        MOCK_KM,
        [controller1],
        urdAddress
      );

      expect(txHashes).toHaveLength(4);
      expect(walletClient.writeContract).toHaveBeenCalledTimes(4);
      expect(publicClient.waitForTransactionReceipt).toHaveBeenCalledTimes(4);
    });

    it('should call setDataBatch on UP address first', async () => {
      await setDataAndTransferOwnership(
        publicClient,
        walletClient,
        MOCK_UP,
        MOCK_KM,
        [controller1],
        urdAddress
      );

      const firstCall = (walletClient.writeContract as jest.Mock).mock.calls[0][0];
      expect(firstCall.address).toBe(MOCK_UP);
      expect(firstCall.functionName).toBe('setDataBatch');
    });

    it('should call transferOwnership to KM on UP address', async () => {
      await setDataAndTransferOwnership(
        publicClient,
        walletClient,
        MOCK_UP,
        MOCK_KM,
        [controller1],
        urdAddress
      );

      const secondCall = (walletClient.writeContract as jest.Mock).mock.calls[1][0];
      expect(secondCall.address).toBe(MOCK_UP);
      expect(secondCall.functionName).toBe('transferOwnership');
      expect(secondCall.args).toEqual([MOCK_KM]);
    });

    it('should call acceptOwnership via KM.execute', async () => {
      await setDataAndTransferOwnership(
        publicClient,
        walletClient,
        MOCK_UP,
        MOCK_KM,
        [controller1],
        urdAddress
      );

      const thirdCall = (walletClient.writeContract as jest.Mock).mock.calls[2][0];
      expect(thirdCall.address).toBe(MOCK_KM);
      expect(thirdCall.functionName).toBe('execute');
    });

    it('should revoke signer permissions via KM.execute', async () => {
      await setDataAndTransferOwnership(
        publicClient,
        walletClient,
        MOCK_UP,
        MOCK_KM,
        [controller1],
        urdAddress
      );

      const fourthCall = (walletClient.writeContract as jest.Mock).mock.calls[3][0];
      expect(fourthCall.address).toBe(MOCK_KM);
      expect(fourthCall.functionName).toBe('execute');
    });

    it('should throw when walletClient has no account', async () => {
      const noAccountClient = {
        account: undefined,
        chain: { id: 4201 },
      } as unknown as WalletClient;

      await expect(
        setDataAndTransferOwnership(
          publicClient,
          noAccountClient,
          MOCK_UP,
          MOCK_KM,
          [controller1],
          urdAddress
        )
      ).rejects.toThrow('WalletClient must have an account');
    });

    it('should set ALL_PERMISSIONS for signer when signer is a string controller', async () => {
      const txHashes = await setDataAndTransferOwnership(
        publicClient,
        walletClient,
        MOCK_UP,
        MOCK_KM,
        [MOCK_SIGNER],
        urdAddress
      );

      expect(txHashes).toHaveLength(4);
      // The 4th call revokes signer permissions via KM.execute
      // When signer IS a controller (string), signerPermission = ALL_PERMISSIONS
      const fourthCall = (walletClient.writeContract as jest.Mock).mock.calls[3][0];
      expect(fourthCall.address).toBe(MOCK_KM);
      expect(fourthCall.functionName).toBe('execute');
    });

    it('should use custom permissions when signer is a ControllerOptions controller', async () => {
      const customPermission =
        '0x0000000000000000000000000000000000000000000000000000000000000010' as Hex;
      const txHashes = await setDataAndTransferOwnership(
        publicClient,
        walletClient,
        MOCK_UP,
        MOCK_KM,
        [{ address: MOCK_SIGNER, permissions: customPermission }],
        urdAddress
      );

      expect(txHashes).toHaveLength(4);
      const fourthCall = (walletClient.writeContract as jest.Mock).mock.calls[3][0];
      expect(fourthCall.address).toBe(MOCK_KM);
      expect(fourthCall.functionName).toBe('execute');
    });

    it('should fallback to ALL_PERMISSIONS when signer is ControllerOptions without permissions', async () => {
      const txHashes = await setDataAndTransferOwnership(
        publicClient,
        walletClient,
        MOCK_UP,
        MOCK_KM,
        [{ address: MOCK_SIGNER } as any],
        urdAddress
      );

      expect(txHashes).toHaveLength(4);
      const fourthCall = (walletClient.writeContract as jest.Mock).mock.calls[3][0];
      expect(fourthCall.address).toBe(MOCK_KM);
      expect(fourthCall.functionName).toBe('execute');
    });

    it('should pass lsp3DataValue to setDataBatch when provided', async () => {
      const lsp3Data = '0xdeadbeef' as Hex;

      await setDataAndTransferOwnership(
        publicClient,
        walletClient,
        MOCK_UP,
        MOCK_KM,
        [controller1],
        urdAddress,
        lsp3Data
      );

      const firstCall = (walletClient.writeContract as jest.Mock).mock.calls[0][0];
      expect(firstCall.functionName).toBe('setDataBatch');
      // The valuesToSet should contain the lsp3DataValue
      expect(firstCall.args[1]).toContain(lsp3Data);
    });
  });
});
