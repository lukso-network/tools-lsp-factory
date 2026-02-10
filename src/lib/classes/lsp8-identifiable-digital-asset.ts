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
  DeployedLSP8IdentifiableDigitalAsset,
  LSP8ContractDeploymentOptions,
  LSP8IdentifiableDigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';
import { LSP4MetadataForEncoding } from '../interfaces/lsp4-digital-asset';

const LSP8_MINTABLE_ABI = [
  {
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'newOwner_', type: 'address' },
      { name: 'lsp4TokenType_', type: 'uint256' },
      { name: 'lsp8TokenIdFormat_', type: 'uint256' },
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
] as const;

export class LSP8IdentifiableDigitalAsset {
  options: LSPFactoryOptions;

  constructor(options: LSPFactoryOptions) {
    this.options = options;
  }

  async deploy(
    digitalAssetDeploymentOptions: LSP8IdentifiableDigitalAssetDeploymentOptions,
    contractDeploymentOptions?: LSP8ContractDeploymentOptions
  ): Promise<DeployedLSP8IdentifiableDigitalAsset> {
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

    const baseContractAddress = chainConfig?.contracts?.LSP8Mintable?.versions?.[
      (contractDeploymentOptions?.LSP8IdentifiableDigitalAsset?.version ??
        defaultVersion) as keyof typeof chainConfig.contracts.LSP8Mintable.versions
    ] as Hex | undefined;

    const shouldDeployProxy =
      contractDeploymentOptions?.LSP8IdentifiableDigitalAsset?.deployProxy !== false &&
      baseContractAddress;

    const lsp4TokenType =
      typeof digitalAssetDeploymentOptions.tokenType === 'string'
        ? LSP4_TOKEN_TYPES[digitalAssetDeploymentOptions.tokenType]
        : digitalAssetDeploymentOptions.tokenType;

    const tokenIdFormat =
      typeof digitalAssetDeploymentOptions.tokenIdFormat === 'string'
        ? parseInt(digitalAssetDeploymentOptions.tokenIdFormat)
        : digitalAssetDeploymentOptions.tokenIdFormat;

    emitEvent({
      type: shouldDeployProxy ? DeploymentType.PROXY : DeploymentType.DEPLOYMENT,
      status: DeploymentStatus.PENDING,
      contractName: ContractNames.LSP8_DIGITAL_ASSET,
    });

    let contractAddress: Hex;
    let deployTxHash: Hex;

    if (shouldDeployProxy) {
      const proxyBytecode = getProxyByteCode(baseContractAddress);
      deployTxHash = await walletClient.sendTransaction({
        data: proxyBytecode,
        account,
        chain: walletClient.chain,
      } as any);
      const proxyReceipt = await publicClient.waitForTransactionReceipt({ hash: deployTxHash });
      contractAddress = proxyReceipt.contractAddress as Hex;

      const initHash = await walletClient.writeContract({
        address: contractAddress,
        abi: LSP8_MINTABLE_ABI,
        functionName: 'initialize',
        args: [
          digitalAssetDeploymentOptions.name,
          digitalAssetDeploymentOptions.symbol,
          signerAddress,
          BigInt(lsp4TokenType),
          BigInt(tokenIdFormat),
        ],
        account,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: initHash });
    } else {
      throw new Error(
        'Direct deployment (non-proxy) for LSP8 is not yet supported in v4. Use deployProxy: true.'
      );
    }

    const deployReceipt = await publicClient.getTransactionReceipt({ hash: deployTxHash });

    emitEvent({
      type: shouldDeployProxy ? DeploymentType.PROXY : DeploymentType.DEPLOYMENT,
      status: DeploymentStatus.COMPLETE,
      contractName: ContractNames.LSP8_DIGITAL_ASSET,
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
          abi: LSP8_MINTABLE_ABI,
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
        abi: LSP8_MINTABLE_ABI,
        functionName: 'transferOwnership',
        args: [digitalAssetDeploymentOptions.controllerAddress],
        account,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: transferHash });
    }

    const contracts: DeployedLSP8IdentifiableDigitalAsset = {
      LSP8IdentifiableDigitalAsset: {
        address: contractAddress,
        receipt: deployReceipt,
      },
    };

    onDeployEvents?.complete?.(contracts);

    return contracts;
  }
}
