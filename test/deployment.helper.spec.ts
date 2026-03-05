import type { Hex, PublicClient, TransactionReceipt, WalletClient } from 'viem';

import {
  deployDigitalAssetProxy,
  getProxyByteCode,
  resolveTokenType,
} from '../src/lib/helpers/deployment.helper';

const MOCK_SIGNER = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as Hex;
const MOCK_TX = ('0x' + 'ab'.repeat(32)) as Hex;
const MOCK_CONTRACT = '0x4444444444444444444444444444444444444444' as Hex;

describe('deployment.helper', () => {
  describe('getProxyByteCode', () => {
    it('should return EIP-1167 minimal proxy bytecode for a given address', () => {
      const address = '0x1234567890AbcDef1234567890AbCdEf12345678';
      const result = getProxyByteCode(address);

      expect(result).toContain('1234567890AbcDef1234567890AbCdEf12345678');
      expect(result.startsWith('0x3d602d80600a3d3981f3363d3d373d3d3d363d73')).toBe(true);
      expect(result.endsWith('5af43d82803e903d91602b57fd5bf3')).toBe(true);
    });

    it('should produce different bytecodes for different addresses', () => {
      const addr1 = '0x1111111111111111111111111111111111111111' as Hex;
      const addr2 = '0x2222222222222222222222222222222222222222' as Hex;

      expect(getProxyByteCode(addr1)).not.toBe(getProxyByteCode(addr2));
    });

    it('should produce bytecode of consistent length', () => {
      const addr = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as Hex;
      const result = getProxyByteCode(addr);

      // EIP-1167 proxy bytecode is always the same length: 0x prefix + 110 hex chars
      expect(result.length).toBe(2 + 110);
    });
  });

  describe('resolveTokenType', () => {
    it('should return numeric value for string token type names', () => {
      expect(resolveTokenType('TOKEN')).toBe(0);
      expect(resolveTokenType('NFT')).toBe(1);
      expect(resolveTokenType('COLLECTION')).toBe(2);
    });

    it('should pass through numeric values', () => {
      expect(resolveTokenType(0)).toBe(0);
      expect(resolveTokenType(1)).toBe(1);
      expect(resolveTokenType(2)).toBe(2);
    });
  });

  describe('deployDigitalAssetProxy', () => {
    let publicClient: PublicClient;
    let walletClient: WalletClient;
    let mockProxyReceipt: TransactionReceipt;

    const initAbi = [
      {
        inputs: [
          { name: 'name_', type: 'string' },
          { name: 'symbol_', type: 'string' },
          { name: 'newOwner_', type: 'address' },
          { name: 'lsp4TokenType_', type: 'uint256' },
          { name: 'isNonDivisible_', type: 'bool' },
        ],
        name: 'initialize',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const;

    beforeEach(() => {
      mockProxyReceipt = {
        transactionHash: MOCK_TX,
        blockHash: ('0x' + '00'.repeat(32)) as Hex,
        blockNumber: 1n,
        status: 'success',
        contractAddress: MOCK_CONTRACT,
      } as unknown as TransactionReceipt;

      publicClient = {
        chain: { id: 4201 },
        waitForTransactionReceipt: jest.fn().mockResolvedValue(mockProxyReceipt),
      } as unknown as PublicClient;

      walletClient = {
        account: { address: MOCK_SIGNER },
        chain: { id: 4201 },
        sendTransaction: jest.fn().mockResolvedValue(MOCK_TX),
        writeContract: jest.fn().mockResolvedValue(MOCK_TX),
      } as unknown as WalletClient;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should deploy proxy, initialize, and return deployed contract', async () => {
      const result = await deployDigitalAssetProxy(
        { publicClient, walletClient, chainId: 4201 },
        MOCK_SIGNER,
        undefined,
        {
          contractKey: 'LSP7Mintable',
          contractName: 'LSP7DigitalAsset',
          initAbi,
          initArgs: ['Test', 'TST', MOCK_SIGNER, 0n, false],
        }
      );

      expect(result.address).toBe(MOCK_CONTRACT);
      expect(result.receipt).toBe(mockProxyReceipt);
    });

    it('should throw when walletClient has no account', async () => {
      await expect(
        deployDigitalAssetProxy(
          {
            publicClient,
            walletClient: { account: undefined } as unknown as WalletClient,
            chainId: 4201,
          },
          MOCK_SIGNER,
          undefined,
          {
            contractKey: 'LSP7Mintable',
            contractName: 'LSP7DigitalAsset',
            initAbi,
            initArgs: ['Test', 'TST', MOCK_SIGNER, 0n, false],
          }
        )
      ).rejects.toThrow('WalletClient must have an account');
    });

    it('should throw when deployProxy is explicitly false', async () => {
      await expect(
        deployDigitalAssetProxy(
          { publicClient, walletClient, chainId: 4201 },
          MOCK_SIGNER,
          undefined,
          {
            contractKey: 'LSP7Mintable',
            contractName: 'LSP7DigitalAsset',
            initAbi,
            initArgs: ['Test', 'TST', MOCK_SIGNER, 0n, false],
            deployProxy: false,
          }
        )
      ).rejects.toThrow('Direct deployment (non-proxy) for LSP7DigitalAsset is not yet supported');
    });

    it('should emit PENDING and COMPLETE events', async () => {
      const events: any[] = [];
      const next = jest.fn((e: any) => events.push(e));

      await deployDigitalAssetProxy(
        { publicClient, walletClient, chainId: 4201 },
        MOCK_SIGNER,
        undefined,
        {
          contractKey: 'LSP7Mintable',
          contractName: 'LSP7DigitalAsset',
          initAbi,
          initArgs: ['Test', 'TST', MOCK_SIGNER, 0n, false],
        },
        { next }
      );

      expect(events).toHaveLength(2);
      expect(events[0].status).toBe('PENDING');
      expect(events[1].status).toBe('COMPLETE');
    });

    it('should set metadata when digitalAssetMetadata is a string', async () => {
      await deployDigitalAssetProxy(
        { publicClient, walletClient, chainId: 4201 },
        MOCK_SIGNER,
        '0xdeadbeef',
        {
          contractKey: 'LSP7Mintable',
          contractName: 'LSP7DigitalAsset',
          initAbi,
          initArgs: ['Test', 'TST', MOCK_SIGNER, 0n, false],
        }
      );

      // initialize + setDataBatch
      expect(walletClient.writeContract).toHaveBeenCalledTimes(2);
    });

    it('should transfer ownership when controller differs from signer', async () => {
      const controller = '0x3333333333333333333333333333333333333333' as Hex;

      await deployDigitalAssetProxy(
        { publicClient, walletClient, chainId: 4201 },
        controller,
        undefined,
        {
          contractKey: 'LSP7Mintable',
          contractName: 'LSP7DigitalAsset',
          initAbi,
          initArgs: ['Test', 'TST', MOCK_SIGNER, 0n, false],
        }
      );

      // initialize + transferOwnership
      expect(walletClient.writeContract).toHaveBeenCalledTimes(2);
      const lastCall = (walletClient.writeContract as jest.Mock).mock.calls[1][0];
      expect(lastCall.functionName).toBe('transferOwnership');
      expect(lastCall.args).toEqual([controller]);
    });

    it('should NOT transfer ownership when controller is the signer', async () => {
      await deployDigitalAssetProxy(
        { publicClient, walletClient, chainId: 4201 },
        MOCK_SIGNER,
        undefined,
        {
          contractKey: 'LSP7Mintable',
          contractName: 'LSP7DigitalAsset',
          initAbi,
          initArgs: ['Test', 'TST', MOCK_SIGNER, 0n, false],
        }
      );

      // initialize only — no transferOwnership
      expect(walletClient.writeContract).toHaveBeenCalledTimes(1);
    });
  });
});
