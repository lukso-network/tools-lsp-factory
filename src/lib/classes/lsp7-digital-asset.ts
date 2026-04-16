import { getAddress, Hex } from 'viem';

import { deployDigitalAssetProxy, resolveTokenType } from '../helpers/deployment.helper';
import { LSPFactoryOptions } from '../interfaces';
import {
  ContractNames,
  DeployedLSP7DigitalAsset,
  LSP7ContractDeploymentOptions,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';

const LSP7_INIT_ABI = [
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

export class LSP7DigitalAsset {
  options: LSPFactoryOptions;

  constructor(options: LSPFactoryOptions) {
    this.options = options;
  }

  async deploy(
    digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
    contractDeploymentOptions?: LSP7ContractDeploymentOptions,
  ): Promise<DeployedLSP7DigitalAsset> {
    const account = this.options.walletClient.account;
    if (!account) throw new Error('WalletClient must have an account');

    const signerAddress = getAddress(account.address) as Hex;
    const lsp4TokenType = resolveTokenType(digitalAssetDeploymentOptions.tokenType);

    const onDeployEvents = contractDeploymentOptions?.onDeployEvents;

    const deployed = await deployDigitalAssetProxy(
      this.options,
      digitalAssetDeploymentOptions.controllerAddress,
      digitalAssetDeploymentOptions.digitalAssetMetadata,
      {
        contractKey: 'LSP7Mintable',
        contractName: ContractNames.LSP7_DIGITAL_ASSET,
        initAbi: LSP7_INIT_ABI,
        initArgs: [
          digitalAssetDeploymentOptions.name,
          digitalAssetDeploymentOptions.symbol,
          signerAddress,
          BigInt(lsp4TokenType),
          digitalAssetDeploymentOptions.isNFT,
        ],
        deployProxy: contractDeploymentOptions?.LSP7DigitalAsset?.deployProxy,
        version: contractDeploymentOptions?.LSP7DigitalAsset?.version,
      },
      onDeployEvents,
    );

    const contracts: DeployedLSP7DigitalAsset = {
      LSP7DigitalAsset: deployed,
    };

    onDeployEvents?.complete?.(contracts);

    return contracts;
  }
}
