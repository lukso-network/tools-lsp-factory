import { ERC725YDataKeys, LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';
import { getAddress, Hex } from 'viem';

import contractVersions from '../../versions.json';
import {
  DeployedContract,
  DeploymentEvent,
  DeploymentStatus,
  DeploymentType,
  LSPFactoryOptions,
} from '../interfaces';
import { LSP4MetadataForEncoding } from '../interfaces/lsp4-digital-asset';

import { DEFAULT_CONTRACT_VERSION } from './config.helper';
import { erc725EncodeData } from './erc725.helper';

// Shared ABI entries for setDataBatch and transferOwnership (used by LSP7 & LSP8)
const DIGITAL_ASSET_ABI = [
  {
    inputs: [
      { name: 'dataKeys', type: 'bytes32[]' },
      { name: 'dataValues', type: 'bytes[]' },
    ],
    name: 'setDataBatch',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function getProxyByteCode(address: Hex): Hex {
  return `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${address.slice(
    2,
  )}5af43d82803e903d91602b57fd5bf3`;
}

export interface DigitalAssetDeployConfig {
  contractKey: 'LSP7Mintable' | 'LSP8Mintable';
  contractName: string;
  initAbi: readonly any[];
  initArgs: readonly any[];
  deployProxy?: boolean;
  version?: string;
}

/**
 * Resolve the token type from a string name or numeric value.
 */
export function resolveTokenType(tokenType: string | number): number {
  return typeof tokenType === 'string'
    ? LSP4_TOKEN_TYPES[tokenType as keyof typeof LSP4_TOKEN_TYPES]
    : tokenType;
}

/**
 * Shared deployment flow for LSP7 and LSP8 digital assets.
 * Handles: proxy deploy, initialize, metadata, ownership transfer, events.
 *
 * Returns the deployed contract info. Callers wrap this into their typed result.
 */
export async function deployDigitalAssetProxy(
  options: LSPFactoryOptions,
  controllerAddress: Hex,
  digitalAssetMetadata: LSP4MetadataForEncoding | string | undefined,
  config: DigitalAssetDeployConfig,
  onDeployEvents?: {
    next?: (value: DeploymentEvent) => void;
  },
): Promise<DeployedContract> {
  const { publicClient, walletClient, chainId } = options;

  const account = walletClient.account;
  if (!account) throw new Error('WalletClient must have an account');

  const signerAddress = getAddress(account.address) as Hex;

  const chainConfig = contractVersions[String(chainId) as keyof typeof contractVersions];

  const contractGroup = chainConfig?.contracts?.[
    config.contractKey as keyof typeof chainConfig.contracts
  ] as { versions: Record<string, string> } | undefined;

  const baseContractAddress = contractGroup?.versions?.[
    config.version ?? DEFAULT_CONTRACT_VERSION
  ] as Hex | undefined;

  if (config.deployProxy === false || !baseContractAddress) {
    throw new Error(
      `Direct deployment (non-proxy) for ${config.contractName} is not yet supported in v4. Use deployProxy: true.`,
    );
  }

  const emitEvent = (event: DeploymentEvent) => {
    onDeployEvents?.next?.(event);
  };

  emitEvent({
    type: DeploymentType.PROXY,
    status: DeploymentStatus.PENDING,
    contractName: config.contractName,
  });

  // Deploy minimal proxy
  const proxyBytecode = getProxyByteCode(baseContractAddress);
  const deployTxHash = await walletClient.sendTransaction({
    data: proxyBytecode,
    account,
    chain: walletClient.chain,
  } as any);
  const deployReceipt = await publicClient.waitForTransactionReceipt({ hash: deployTxHash });
  const contractAddress = deployReceipt.contractAddress as Hex;

  // Initialize proxy
  const initHash = await walletClient.writeContract({
    address: contractAddress,
    abi: config.initAbi,
    functionName: 'initialize',
    args: config.initArgs,
    account,
    chain: walletClient.chain,
  });
  await publicClient.waitForTransactionReceipt({ hash: initHash });

  emitEvent({
    type: DeploymentType.PROXY,
    status: DeploymentStatus.COMPLETE,
    contractName: config.contractName,
    txHash: deployTxHash,
    receipt: deployReceipt,
  });

  // Set metadata if provided
  if (digitalAssetMetadata) {
    let encodedMetadata: string | undefined;

    if (typeof digitalAssetMetadata === 'string') {
      encodedMetadata = digitalAssetMetadata;
    } else {
      const encoded = erc725EncodeData(digitalAssetMetadata, 'LSP4Metadata');
      encodedMetadata = encoded.values[0];
    }

    if (encodedMetadata) {
      await walletClient.writeContract({
        address: contractAddress,
        abi: DIGITAL_ASSET_ABI,
        functionName: 'setDataBatch',
        args: [[ERC725YDataKeys.LSP4.LSP4Metadata as Hex], [encodedMetadata as Hex]],
        account,
        chain: walletClient.chain,
      });
    }
  }

  // Transfer ownership if controller is different from signer
  if (getAddress(controllerAddress) !== signerAddress) {
    const transferHash = await walletClient.writeContract({
      address: contractAddress,
      abi: DIGITAL_ASSET_ABI,
      functionName: 'transferOwnership',
      args: [controllerAddress],
      account,
      chain: walletClient.chain,
    });
    await publicClient.waitForTransactionReceipt({ hash: transferHash });
  }

  const deployed: DeployedContract = {
    address: contractAddress,
    receipt: deployReceipt,
  };

  return deployed;
}
