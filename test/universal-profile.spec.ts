import type { PublicClient, TransactionReceipt, WalletClient } from 'viem';

import {
  computeAddressesViaLSP23,
  deployViaLSP23,
  setDataAndTransferOwnership,
} from '../src/lib/helpers/lsp23.helper';
import type { DeploymentEvent, LSPFactoryOptions } from '../src/lib/interfaces';
import { DeploymentStatus, DeploymentType } from '../src/lib/interfaces';
import { ContractNames } from '../src/lib/interfaces/profile-deployment';

import { UniversalProfile } from '../src/lib/classes/universal-profile';

jest.mock('../src/lib/helpers/lsp23.helper');
const mockedDeployViaLSP23 = jest.mocked(deployViaLSP23);
const mockedSetData = jest.mocked(setDataAndTransferOwnership);
const mockedCompute = jest.mocked(computeAddressesViaLSP23);

const MOCK_SIGNER = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`;
const MOCK_UP = '0x1111111111111111111111111111111111111111' as `0x${string}`;
const MOCK_KM = '0x2222222222222222222222222222222222222222' as `0x${string}`;
const MOCK_TX = ('0x' + 'ab'.repeat(32)) as `0x${string}`;
const MOCK_SALT = ('0x' + 'cc'.repeat(32)) as `0x${string}`;
const MOCK_CONTROLLER = '0x3333333333333333333333333333333333333333' as `0x${string}`;

describe('UniversalProfile', () => {
  let up: UniversalProfile;
  let publicClient: PublicClient;
  let walletClient: WalletClient;
  let mockReceipt: TransactionReceipt;

  beforeEach(() => {
    mockReceipt = {
      transactionHash: MOCK_TX,
      blockHash: ('0x' + '00'.repeat(32)) as `0x${string}`,
      blockNumber: 1n,
      status: 'success',
      contractAddress: null,
    } as unknown as TransactionReceipt;

    publicClient = {
      chain: { id: 4201 },
      waitForTransactionReceipt: jest.fn().mockResolvedValue(mockReceipt),
      readContract: jest.fn(),
    } as unknown as PublicClient;

    walletClient = {
      account: { address: MOCK_SIGNER },
      chain: { id: 4201 },
      writeContract: jest.fn().mockResolvedValue(MOCK_TX),
    } as unknown as WalletClient;

    const options: LSPFactoryOptions = {
      publicClient,
      walletClient,
      chainId: 4201,
    };

    up = new UniversalProfile(options);

    mockedDeployViaLSP23.mockResolvedValue({
      upAddress: MOCK_UP,
      kmAddress: MOCK_KM,
      txHash: MOCK_TX,
    });
    mockedSetData.mockResolvedValue([MOCK_TX]);
    mockedCompute.mockResolvedValue({
      upAddress: MOCK_UP,
      kmAddress: MOCK_KM,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('deploy', () => {
    it('should deploy with a default random salt when none is provided', async () => {
      const result = await up.deploy({
        controllerAddresses: [MOCK_CONTROLLER],
      });

      expect(mockedDeployViaLSP23).toHaveBeenCalledTimes(1);
      expect(mockedSetData).toHaveBeenCalledTimes(1);
      expect(result.LSP0ERC725Account.address).toBe(MOCK_UP);
      expect(result.LSP6KeyManager.address).toBe(MOCK_KM);
    });

    it('should deploy with an explicit salt', async () => {
      await up.deploy({ controllerAddresses: [MOCK_CONTROLLER] }, { salt: MOCK_SALT });

      const params = mockedDeployViaLSP23.mock.calls[0][2];
      expect(params.salt).toBe(MOCK_SALT);
    });

    it('should deploy with string controller addresses', async () => {
      await up.deploy({
        controllerAddresses: [MOCK_CONTROLLER],
      });

      const controllers = mockedSetData.mock.calls[0][4];
      expect(controllers).toEqual([MOCK_CONTROLLER]);
    });

    it('should deploy with ControllerOptions objects', async () => {
      const controllerOpts = {
        address: MOCK_CONTROLLER,
        permissions:
          '0x0000000000000000000000000000000000000000000000000000000000000010' as `0x${string}`,
      };

      await up.deploy({
        controllerAddresses: [controllerOpts],
      });

      const controllers = mockedSetData.mock.calls[0][4];
      expect(controllers).toEqual([controllerOpts]);
    });

    it('should deploy with mixed string and ControllerOptions controllers', async () => {
      const controllerOpts = {
        address: '0x4444444444444444444444444444444444444444' as `0x${string}`,
        permissions:
          '0x0000000000000000000000000000000000000000000000000000000000000010' as `0x${string}`,
      };

      await up.deploy({
        controllerAddresses: [MOCK_CONTROLLER, controllerOpts],
      });

      const controllers = mockedSetData.mock.calls[0][4];
      expect(controllers).toEqual([MOCK_CONTROLLER, controllerOpts]);
    });

    it('should pass lsp3DataValue to setDataAndTransferOwnership', async () => {
      const lsp3Data = '0xdeadbeef' as `0x${string}`;

      await up.deploy({
        controllerAddresses: [MOCK_CONTROLLER],
        lsp3DataValue: lsp3Data,
      });

      const lsp3Arg = mockedSetData.mock.calls[0][6];
      expect(lsp3Arg).toBe(lsp3Data);
    });

    it('should not pass lsp3DataValue when omitted', async () => {
      await up.deploy({
        controllerAddresses: [MOCK_CONTROLLER],
      });

      const lsp3Arg = mockedSetData.mock.calls[0][6];
      expect(lsp3Arg).toBeUndefined();
    });

    it('should return deployed contract addresses and receipts', async () => {
      const result = await up.deploy({
        controllerAddresses: [MOCK_CONTROLLER],
      });

      expect(result).toEqual({
        LSP0ERC725Account: { address: MOCK_UP, receipt: mockReceipt },
        LSP6KeyManager: { address: MOCK_KM, receipt: mockReceipt },
      });
    });

    it('should emit deployment events in correct order', async () => {
      const events: DeploymentEvent[] = [];
      const next = jest.fn((e: DeploymentEvent) => events.push(e));

      await up.deploy({ controllerAddresses: [MOCK_CONTROLLER] }, { onDeployEvents: { next } });

      expect(events).toHaveLength(4);
      expect(events[0]).toMatchObject({
        type: DeploymentType.PROXY,
        status: DeploymentStatus.PENDING,
        contractName: ContractNames.ERC725_Account,
        functionName: 'deployERC1167Proxies',
      });
      expect(events[1]).toMatchObject({
        type: DeploymentType.PROXY,
        status: DeploymentStatus.COMPLETE,
        contractName: ContractNames.ERC725_Account,
        txHash: MOCK_TX,
        receipt: mockReceipt,
      });
      expect(events[2]).toMatchObject({
        type: DeploymentType.TRANSACTION,
        status: DeploymentStatus.PENDING,
        contractName: ContractNames.ERC725_Account,
        functionName: 'setDataAndTransferOwnership',
      });
      expect(events[3]).toMatchObject({
        type: DeploymentType.TRANSACTION,
        status: DeploymentStatus.COMPLETE,
        contractName: ContractNames.ERC725_Account,
      });
    });

    it('should call complete callback with deployed contracts', async () => {
      const complete = jest.fn();

      await up.deploy({ controllerAddresses: [MOCK_CONTROLLER] }, { onDeployEvents: { complete } });

      expect(complete).toHaveBeenCalledTimes(1);
      expect(complete).toHaveBeenCalledWith({
        LSP0ERC725Account: { address: MOCK_UP, receipt: mockReceipt },
        LSP6KeyManager: { address: MOCK_KM, receipt: mockReceipt },
      });
    });

    it('should call error callback and rethrow when deployViaLSP23 fails', async () => {
      const error = new Error('deploy failed');
      mockedDeployViaLSP23.mockRejectedValue(error);
      const onError = jest.fn();

      await expect(
        up.deploy(
          { controllerAddresses: [MOCK_CONTROLLER] },
          { onDeployEvents: { error: onError } }
        )
      ).rejects.toThrow('deploy failed');

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should call error callback and rethrow when setDataAndTransferOwnership fails', async () => {
      const error = new Error('setData failed');
      mockedSetData.mockRejectedValue(error);
      const onError = jest.fn();

      await expect(
        up.deploy(
          { controllerAddresses: [MOCK_CONTROLLER] },
          { onDeployEvents: { error: onError } }
        )
      ).rejects.toThrow('setData failed');

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should throw when walletClient has no account', async () => {
      up = new UniversalProfile({
        publicClient,
        walletClient: {
          account: undefined,
          chain: { id: 4201 },
        } as unknown as WalletClient,
        chainId: 4201,
      });

      await expect(up.deploy({ controllerAddresses: [MOCK_CONTROLLER] })).rejects.toThrow(
        'WalletClient must have an account'
      );
    });

    it('should throw for unknown chain ID', async () => {
      up = new UniversalProfile({
        publicClient,
        walletClient,
        chainId: 9999,
      });

      await expect(up.deploy({ controllerAddresses: [MOCK_CONTROLLER] })).rejects.toThrow(
        'No contract configuration found for chain 9999'
      );
    });

    it('should pass correct base contract addresses from chain config', async () => {
      await up.deploy({ controllerAddresses: [MOCK_CONTROLLER] }, { salt: MOCK_SALT });

      const params = mockedDeployViaLSP23.mock.calls[0][2];
      expect(params.upBaseContractAddress).toBe('0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F');
      expect(params.kmBaseContractAddress).toBe('0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4');
      expect(params.lsp23FactoryAddress).toBe('0x2300000A84D25dF63081feAa37ba6b62C4c89a30');
    });

    it('should pass signer address as upInitOwner', async () => {
      await up.deploy({ controllerAddresses: [MOCK_CONTROLLER] }, { salt: MOCK_SALT });

      const params = mockedDeployViaLSP23.mock.calls[0][2];
      expect(params.upInitOwner.toLowerCase()).toBe(MOCK_SIGNER.toLowerCase());
    });

    it('should pass the URD address to setDataAndTransferOwnership', async () => {
      await up.deploy({ controllerAddresses: [MOCK_CONTROLLER] });

      const urdArg = mockedSetData.mock.calls[0][5];
      expect(urdArg).toBe('0x7870C5B8BC9572A8001C3f96f7ff59961B23500D');
    });

    it('should pass UP and KM addresses to setDataAndTransferOwnership', async () => {
      await up.deploy({ controllerAddresses: [MOCK_CONTROLLER] });

      const call = mockedSetData.mock.calls[0];
      expect(call[0]).toBe(publicClient);
      expect(call[1]).toBe(walletClient);
      expect(call[2]).toBe(MOCK_UP);
      expect(call[3]).toBe(MOCK_KM);
    });
  });

  describe('computeAddress', () => {
    it('should return UP and KeyManager addresses', async () => {
      const result = await up.computeAddress(
        { controllerAddresses: [MOCK_CONTROLLER] },
        { salt: MOCK_SALT }
      );

      expect(result.upAddress).toBe(MOCK_UP);
      expect(result.keyManagerAddress).toBe(MOCK_KM);
    });

    it('should call computeAddressesViaLSP23 with correct params', async () => {
      await up.computeAddress({ controllerAddresses: [MOCK_CONTROLLER] }, { salt: MOCK_SALT });

      expect(mockedCompute).toHaveBeenCalledTimes(1);
      const call = mockedCompute.mock.calls[0];
      expect(call[0]).toBe(publicClient);
      expect(call[1].salt).toBe(MOCK_SALT);
      expect(call[1].lsp23FactoryAddress).toBe('0x2300000A84D25dF63081feAa37ba6b62C4c89a30');
    });

    it('should produce consistent results with the same salt', async () => {
      const result1 = await up.computeAddress(
        { controllerAddresses: [MOCK_CONTROLLER] },
        { salt: MOCK_SALT }
      );
      const result2 = await up.computeAddress(
        { controllerAddresses: [MOCK_CONTROLLER] },
        { salt: MOCK_SALT }
      );

      expect(result1).toEqual(result2);
    });

    it('should use a random salt when none is provided', async () => {
      await up.computeAddress({ controllerAddresses: [MOCK_CONTROLLER] });

      expect(mockedCompute).toHaveBeenCalledTimes(1);
      const call = mockedCompute.mock.calls[0];
      expect(call[1].salt).toBeDefined();
      expect(call[1].salt).toMatch(/^0x[0-9a-f]+$/i);
    });

    it('should throw when walletClient has no account', async () => {
      up = new UniversalProfile({
        publicClient,
        walletClient: {
          account: undefined,
          chain: { id: 4201 },
        } as unknown as WalletClient,
        chainId: 4201,
      });

      await expect(
        up.computeAddress({ controllerAddresses: [MOCK_CONTROLLER] }, { salt: MOCK_SALT })
      ).rejects.toThrow('WalletClient must have an account');
    });

    it('should throw for unknown chain ID', async () => {
      up = new UniversalProfile({
        publicClient,
        walletClient,
        chainId: 9999,
      });

      await expect(
        up.computeAddress({ controllerAddresses: [MOCK_CONTROLLER] }, { salt: MOCK_SALT })
      ).rejects.toThrow('No contract configuration found for chain 9999');
    });
  });
});
