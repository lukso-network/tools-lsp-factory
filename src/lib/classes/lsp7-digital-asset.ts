import { ERC725YDataKeys, LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';
import { getAddress, Hex } from 'viem';

import contractVersions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import { getProxyByteCode } from '../helpers/deployment.helper';
import { erc725EncodeData } from '../helpers/erc725.helper';
import {
  DeploymentEvent,
  DeploymentStatus,
  DeploymentType,
  LSPFactoryOptions,
} from '../interfaces';
import {
  ContractNames,
  DeployedLSP7DigitalAsset,
  LSP7ContractDeploymentOptions,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';
import { LSP4MetadataForEncoding } from '../interfaces/lsp4-digital-asset';

// Minimal ABIs for LSP7
const LSP7_MINTABLE_ABI = [
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
  {
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export class LSP7DigitalAsset {
  options: LSPFactoryOptions;

  constructor(options: LSPFactoryOptions) {
    this.options = options;
  }

  async deploy(
    digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
    contractDeploymentOptions?: LSP7ContractDeploymentOptions
  ): Promise<DeployedLSP7DigitalAsset> {
    const { publicClient, walletClient, chainId } = this.options;
    const onDeployEvents = contractDeploymentOptions?.onDeployEvents;

    const emitEvent = (event: DeploymentEvent) => {
      onDeployEvents?.next?.(event);
    };

    const account = walletClient.account;
    if (!account) throw new Error('WalletClient must have an account');

    const signerAddress = getAddress(account.address) as Hex;

    const chainConfig = contractVersions[String(chainId) as keyof typeof contractVersions];
    const defaultVersion = DEFAULT_CONTRACT_VERSION;

    const baseContractAddress = chainConfig?.contracts?.LSP7Mintable?.versions?.[
      (contractDeploymentOptions?.LSP7DigitalAsset?.version ??
        defaultVersion) as keyof typeof chainConfig.contracts.LSP7Mintable.versions
    ] as Hex | undefined;

    const shouldDeployProxy =
      contractDeploymentOptions?.LSP7DigitalAsset?.deployProxy !== false && baseContractAddress;

    const lsp4TokenType =
      typeof digitalAssetDeploymentOptions.tokenType === 'string'
        ? LSP4_TOKEN_TYPES[digitalAssetDeploymentOptions.tokenType]
        : digitalAssetDeploymentOptions.tokenType;

    emitEvent({
      type: shouldDeployProxy ? DeploymentType.PROXY : DeploymentType.DEPLOYMENT,
      status: DeploymentStatus.PENDING,
      contractName: ContractNames.LSP7_DIGITAL_ASSET,
    });

    let contractAddress: Hex;
    let deployTxHash: Hex;

    if (shouldDeployProxy) {
      // Deploy minimal proxy
      const proxyBytecode = getProxyByteCode(baseContractAddress);
      deployTxHash = await walletClient.sendTransaction({
        data: proxyBytecode,
        account,
        chain: walletClient.chain,
      } as any);
      const proxyReceipt = await publicClient.waitForTransactionReceipt({ hash: deployTxHash });
      contractAddress = proxyReceipt.contractAddress as Hex;

      // Initialize proxy
      const initHash = await walletClient.writeContract({
        address: contractAddress,
        abi: LSP7_MINTABLE_ABI,
        functionName: 'initialize',
        args: [
          digitalAssetDeploymentOptions.name,
          digitalAssetDeploymentOptions.symbol,
          signerAddress,
          BigInt(lsp4TokenType),
          digitalAssetDeploymentOptions.isNFT,
        ],
        account,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: initHash });
    } else {
      throw new Error(
        'Direct deployment (non-proxy) for LSP7 is not yet supported in v4. Use deployProxy: true.'
      );
    }

    const deployReceipt = await publicClient.getTransactionReceipt({ hash: deployTxHash });

    emitEvent({
      type: shouldDeployProxy ? DeploymentType.PROXY : DeploymentType.DEPLOYMENT,
      status: DeploymentStatus.COMPLETE,
      contractName: ContractNames.LSP7_DIGITAL_ASSET,
      txHash: deployTxHash,
      receipt: deployReceipt,
    });

    // Set metadata if provided
    if (digitalAssetDeploymentOptions.digitalAssetMetadata) {
      const metadata = digitalAssetDeploymentOptions.digitalAssetMetadata;
      let encodedMetadata: string | undefined;

      if (typeof metadata === 'string') {
        encodedMetadata = metadata;
      } else {
        const encoded = erc725EncodeData(metadata as LSP4MetadataForEncoding, 'LSP4Metadata');
        encodedMetadata = encoded.values[0];
      }

      if (encodedMetadata) {
        const keysToSet: Hex[] = [ERC725YDataKeys.LSP4.LSP4Metadata as Hex];
        const valuesToSet: Hex[] = [encodedMetadata as Hex];

        await walletClient.writeContract({
          address: contractAddress,
          abi: LSP7_MINTABLE_ABI,
          functionName: 'setDataBatch',
          args: [keysToSet, valuesToSet],
          account,
          chain: walletClient.chain,
        });
      }
    }

    // Transfer ownership if controller is different from signer
    if (getAddress(digitalAssetDeploymentOptions.controllerAddress) !== signerAddress) {
      const transferHash = await walletClient.writeContract({
        address: contractAddress,
        abi: LSP7_MINTABLE_ABI,
        functionName: 'transferOwnership',
        args: [digitalAssetDeploymentOptions.controllerAddress],
        account,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: transferHash });
    }

    const contracts: DeployedLSP7DigitalAsset = {
      LSP7DigitalAsset: {
        address: contractAddress,
        receipt: deployReceipt,
      },
    };

    onDeployEvents?.complete?.(contracts);

    return contracts;
  }
}
