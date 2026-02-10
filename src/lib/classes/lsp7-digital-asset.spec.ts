import { PublicClient, TransactionReceipt, WalletClient } from 'viem';

import { erc725EncodeData } from '../helpers/erc725.helper';
import { DeploymentEvent, DeploymentStatus, DeploymentType } from '../interfaces';
import {
  ContractNames,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';

import { LSP7DigitalAsset } from './lsp7-digital-asset';

jest.mock('../helpers/erc725.helper');
const mockErc725EncodeData = jest.mocked(erc725EncodeData);

const MOCK_SIGNER = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`;
const MOCK_CONTROLLER = '0x3333333333333333333333333333333333333333' as `0x${string}`;
const MOCK_TX = ('0x' + 'ab'.repeat(32)) as `0x${string}`;
const MOCK_CONTRACT = '0x4444444444444444444444444444444444444444' as `0x${string}`;

describe('LSP7DigitalAsset', () => {
  let lsp7: LSP7DigitalAsset;
  let publicClient: PublicClient;
  let walletClient: WalletClient;
  let mockDeployReceipt: TransactionReceipt;
  let mockProxyReceipt: TransactionReceipt;

  const defaultOptions: LSP7DigitalAssetDeploymentOptions = {
    name: 'TestToken',
    symbol: 'TST',
    controllerAddress: MOCK_SIGNER,
    tokenType: 0,
    isNFT: false,
  };

  beforeEach(() => {
    mockDeployReceipt = {
      transactionHash: MOCK_TX,
      blockHash: ('0x' + '00'.repeat(32)) as `0x${string}`,
      blockNumber: 1n,
      status: 'success',
      contractAddress: null,
    } as unknown as TransactionReceipt;

    mockProxyReceipt = {
      ...mockDeployReceipt,
      contractAddress: MOCK_CONTRACT,
    } as unknown as TransactionReceipt;

    publicClient = {
      chain: { id: 4201 },
      waitForTransactionReceipt: jest.fn().mockResolvedValue(mockProxyReceipt),
      getTransactionReceipt: jest.fn().mockResolvedValue(mockDeployReceipt),
    } as unknown as PublicClient;

    walletClient = {
      account: { address: MOCK_SIGNER },
      chain: { id: 4201 },
      sendTransaction: jest.fn().mockResolvedValue(MOCK_TX),
      writeContract: jest.fn().mockResolvedValue(MOCK_TX),
    } as unknown as WalletClient;

    lsp7 = new LSP7DigitalAsset({
      publicClient,
      walletClient,
      chainId: 4201,
    });

    mockErc725EncodeData.mockReturnValue({
      keys: ['0xmockkey'],
      values: ['0xmockvalue'],
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('deploy', () => {
    it('should deploy a proxy and initialize the contract', async () => {
      const result = await lsp7.deploy(defaultOptions);

      expect(walletClient.sendTransaction).toHaveBeenCalledTimes(1);
      expect(walletClient.writeContract).toHaveBeenCalledTimes(1);
      expect(result.LSP7DigitalAsset.address).toBe(MOCK_CONTRACT);
      expect(result.LSP7DigitalAsset.receipt).toBeDefined();
    });

    it('should send proxy bytecode via sendTransaction', async () => {
      await lsp7.deploy(defaultOptions);

      const sendTxCall = (walletClient.sendTransaction as jest.Mock).mock.calls[0][0];
      expect(sendTxCall.data).toMatch(/^0x3d602d80600a3d3981f3363d3d373d3d3d363d73/);
    });

    it('should initialize with correct parameters', async () => {
      await lsp7.deploy(defaultOptions);

      expect(walletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: MOCK_CONTRACT,
          functionName: 'initialize',
          args: ['TestToken', 'TST', expect.any(String), 0n, false],
        })
      );
    });

    it('should initialize with isNFT true', async () => {
      await lsp7.deploy({ ...defaultOptions, isNFT: true });

      expect(walletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'initialize',
          args: expect.arrayContaining([true]),
        })
      );
    });

    it('should handle string tokenType names', async () => {
      await lsp7.deploy({
        ...defaultOptions,
        tokenType: 'TOKEN' as any,
      });

      expect(walletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'initialize',
          args: expect.arrayContaining([0n]),
        })
      );
    });

    it('should handle numeric tokenType values', async () => {
      await lsp7.deploy({ ...defaultOptions, tokenType: 1 });

      expect(walletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'initialize',
          args: expect.arrayContaining([1n]),
        })
      );
    });

    it('should set metadata when digitalAssetMetadata is a string', async () => {
      await lsp7.deploy({
        ...defaultOptions,
        digitalAssetMetadata: '0xdeadbeef',
      });

      // initialize + setDataBatch
      expect(walletClient.writeContract).toHaveBeenCalledTimes(2);
      expect(walletClient.writeContract).toHaveBeenLastCalledWith(
        expect.objectContaining({
          functionName: 'setDataBatch',
        })
      );
    });

    it('should encode and set metadata when digitalAssetMetadata is an object', async () => {
      const metadata = {
        verification: { method: 'keccak256(utf8)', data: '0x1234' },
        url: 'ipfs://QmTest',
      };

      await lsp7.deploy({
        ...defaultOptions,
        digitalAssetMetadata: metadata,
      });

      expect(mockErc725EncodeData).toHaveBeenCalledWith(metadata, 'LSP4Metadata');
      // initialize + setDataBatch
      expect(walletClient.writeContract).toHaveBeenCalledTimes(2);
    });

    it('should not set metadata when digitalAssetMetadata is omitted', async () => {
      await lsp7.deploy(defaultOptions);

      // initialize only
      expect(walletClient.writeContract).toHaveBeenCalledTimes(1);
      const calls = (walletClient.writeContract as jest.Mock).mock.calls;
      const setDataCalls = calls.filter((c: any) => c[0].functionName === 'setDataBatch');
      expect(setDataCalls).toHaveLength(0);
    });

    it('should transfer ownership when controller differs from signer', async () => {
      await lsp7.deploy({
        ...defaultOptions,
        controllerAddress: MOCK_CONTROLLER,
      });

      expect(walletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'transferOwnership',
          args: [MOCK_CONTROLLER],
        })
      );
    });

    it('should NOT transfer ownership when controller is the signer', async () => {
      await lsp7.deploy({
        ...defaultOptions,
        controllerAddress: MOCK_SIGNER,
      });

      const calls = (walletClient.writeContract as jest.Mock).mock.calls;
      const transferCalls = calls.filter((c: any) => c[0].functionName === 'transferOwnership');
      expect(transferCalls).toHaveLength(0);
    });

    it('should emit PENDING and COMPLETE deployment events', async () => {
      const events: DeploymentEvent[] = [];
      const next = jest.fn((e: DeploymentEvent) => events.push(e));

      await lsp7.deploy(defaultOptions, {
        onDeployEvents: { next },
      });

      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({
        type: DeploymentType.PROXY,
        status: DeploymentStatus.PENDING,
        contractName: ContractNames.LSP7_DIGITAL_ASSET,
      });
      expect(events[1]).toMatchObject({
        type: DeploymentType.PROXY,
        status: DeploymentStatus.COMPLETE,
        contractName: ContractNames.LSP7_DIGITAL_ASSET,
        txHash: MOCK_TX,
      });
    });

    it('should call complete callback with deployed contract', async () => {
      const complete = jest.fn();

      await lsp7.deploy(defaultOptions, {
        onDeployEvents: { complete },
      });

      expect(complete).toHaveBeenCalledTimes(1);
      expect(complete).toHaveBeenCalledWith({
        LSP7DigitalAsset: {
          address: MOCK_CONTRACT,
          receipt: mockDeployReceipt,
        },
      });
    });

    it('should throw when walletClient has no account', async () => {
      lsp7 = new LSP7DigitalAsset({
        publicClient,
        walletClient: {
          account: undefined,
          chain: { id: 4201 },
        } as unknown as WalletClient,
        chainId: 4201,
      });

      await expect(lsp7.deploy(defaultOptions)).rejects.toThrow(
        'WalletClient must have an account'
      );
    });

    it('should throw when deployProxy is explicitly false', async () => {
      await expect(
        lsp7.deploy(defaultOptions, {
          LSP7DigitalAsset: { deployProxy: false },
        })
      ).rejects.toThrow('Direct deployment (non-proxy) for LSP7 is not yet supported in v4');
    });

    it('should wait for proxy deployment receipt', async () => {
      await lsp7.deploy(defaultOptions);

      expect(publicClient.waitForTransactionReceipt).toHaveBeenCalledWith({
        hash: MOCK_TX,
      });
    });
  });
});
