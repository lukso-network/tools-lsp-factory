import { getAddress, Hex } from 'viem';

import { deployDigitalAssetProxy, resolveTokenType } from '../helpers/deployment.helper';
import { LSPFactoryOptions } from '../interfaces';
import {
  ContractNames,
  DeployedLSP8IdentifiableDigitalAsset,
  LSP8ContractDeploymentOptions,
  LSP8IdentifiableDigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';

const LSP8_INIT_ABI = [
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
] as const;

export class LSP8IdentifiableDigitalAsset {
  options: LSPFactoryOptions;

  constructor(options: LSPFactoryOptions) {
    this.options = options;
  }

  async deploy(
    digitalAssetDeploymentOptions: LSP8IdentifiableDigitalAssetDeploymentOptions,
    contractDeploymentOptions?: LSP8ContractDeploymentOptions,
  ): Promise<DeployedLSP8IdentifiableDigitalAsset> {
    const account = this.options.walletClient.account;
    if (!account) throw new Error('WalletClient must have an account');

    const signerAddress = getAddress(account.address) as Hex;
    const lsp4TokenType = resolveTokenType(digitalAssetDeploymentOptions.tokenType);
    const tokenIdFormat =
      typeof digitalAssetDeploymentOptions.tokenIdFormat === 'string'
        ? parseInt(digitalAssetDeploymentOptions.tokenIdFormat)
        : digitalAssetDeploymentOptions.tokenIdFormat;

    const onDeployEvents = contractDeploymentOptions?.onDeployEvents;

    const deployed = await deployDigitalAssetProxy(
      this.options,
      digitalAssetDeploymentOptions.controllerAddress,
      digitalAssetDeploymentOptions.digitalAssetMetadata,
      {
        contractKey: 'LSP8Mintable',
        contractName: ContractNames.LSP8_DIGITAL_ASSET,
        initAbi: LSP8_INIT_ABI,
        initArgs: [
          digitalAssetDeploymentOptions.name,
          digitalAssetDeploymentOptions.symbol,
          signerAddress,
          BigInt(lsp4TokenType),
          BigInt(tokenIdFormat),
        ],
        deployProxy: contractDeploymentOptions?.LSP8IdentifiableDigitalAsset?.deployProxy,
        version: contractDeploymentOptions?.LSP8IdentifiableDigitalAsset?.version,
      },
      onDeployEvents,
    );

    const contracts: DeployedLSP8IdentifiableDigitalAsset = {
      LSP8IdentifiableDigitalAsset: deployed,
    };

    onDeployEvents?.complete?.(contracts);

    return contracts;
  }
}
