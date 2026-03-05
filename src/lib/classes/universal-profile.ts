import { getAddress, Hex, toHex } from 'viem';

import contractVersions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import {
  computeAddressesViaLSP23,
  deployViaLSP23,
  LSP23DeployParams,
  setDataAndTransferOwnership,
} from '../helpers/lsp23.helper';
import {
  DeploymentEvent,
  DeploymentStatus,
  DeploymentType,
  LSPFactoryOptions,
} from '../interfaces';
import {
  ContractDeploymentOptions,
  ContractNames,
  DeployedUniversalProfileContracts,
  ProfileDeploymentOptions,
} from '../interfaces/profile-deployment';

export class UniversalProfile {
  options: LSPFactoryOptions;

  constructor(options: LSPFactoryOptions) {
    this.options = options;
  }

  /**
   * Resolve chain config, validate wallet, and build LSP23 deploy params.
   * Shared by deploy() and computeAddress().
   */
  private buildDeployParams(
    contractDeploymentOptions?: Pick<ContractDeploymentOptions, 'version' | 'salt'>
  ): {
    lsp23Params: LSP23DeployParams;
    urdAddress: Hex;
  } {
    const { walletClient, chainId } = this.options;

    const defaultContractVersion = contractDeploymentOptions?.version ?? DEFAULT_CONTRACT_VERSION;

    const chainConfig = contractVersions[String(chainId) as keyof typeof contractVersions];
    if (!chainConfig) {
      throw new Error(`No contract configuration found for chain ${chainId}`);
    }

    const upBaseAddress = (chainConfig.contracts.ERC725Account.versions[
      defaultContractVersion as keyof typeof chainConfig.contracts.ERC725Account.versions
    ] ?? Object.values(chainConfig.contracts.ERC725Account.versions).at(-1)) as Hex;

    const kmBaseAddress = (chainConfig.contracts.KeyManager.versions[
      defaultContractVersion as keyof typeof chainConfig.contracts.KeyManager.versions
    ] ?? Object.values(chainConfig.contracts.KeyManager.versions).at(-1)) as Hex;

    const urdAddress = (chainConfig.contracts.UniversalReceiverDelegate.versions[
      defaultContractVersion as keyof typeof chainConfig.contracts.UniversalReceiverDelegate.versions
    ] ?? Object.values(chainConfig.contracts.UniversalReceiverDelegate.versions).at(-1)) as Hex;

    const lsp23FactoryAddress = chainConfig.lsp23FactoryAddress as Hex;

    const salt =
      contractDeploymentOptions?.salt ?? toHex(crypto.getRandomValues(new Uint8Array(32)));

    const account = walletClient.account;
    if (!account) throw new Error('WalletClient must have an account');

    const signerAddress = getAddress(account.address) as Hex;

    return {
      lsp23Params: {
        salt,
        upBaseContractAddress: upBaseAddress,
        kmBaseContractAddress: kmBaseAddress,
        lsp23FactoryAddress,
        upInitOwner: signerAddress,
      },
      urdAddress,
    };
  }

  /**
   * Deploys a Universal Profile (UP + KeyManager) via LSP23 and configures
   * controller permissions and Universal Receiver Delegate.
   */
  async deploy(
    profileDeploymentOptions: ProfileDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ): Promise<DeployedUniversalProfileContracts> {
    const { publicClient, walletClient } = this.options;
    const onDeployEvents = contractDeploymentOptions?.onDeployEvents;

    const emitEvent = (event: DeploymentEvent) => {
      onDeployEvents?.next?.(event);
    };

    const { lsp23Params, urdAddress } = this.buildDeployParams(contractDeploymentOptions);

    // Step 1: Deploy UP + KM via LSP23
    emitEvent({
      type: DeploymentType.PROXY,
      status: DeploymentStatus.PENDING,
      contractName: ContractNames.ERC725_Account,
      functionName: 'deployERC1167Proxies',
    });

    let upAddress: Hex;
    let kmAddress: Hex;
    let deployTxHash: Hex;

    try {
      const result = await deployViaLSP23(publicClient, walletClient, lsp23Params);
      upAddress = result.upAddress;
      kmAddress = result.kmAddress;
      deployTxHash = result.txHash;
    } catch (error) {
      onDeployEvents?.error?.(error);
      throw error;
    }

    const deployReceipt = await publicClient.waitForTransactionReceipt({
      hash: deployTxHash,
    });

    emitEvent({
      type: DeploymentType.PROXY,
      status: DeploymentStatus.COMPLETE,
      contractName: ContractNames.ERC725_Account,
      functionName: 'deployERC1167Proxies',
      txHash: deployTxHash,
      receipt: deployReceipt,
    });

    // Step 2: Set data + transfer ownership
    emitEvent({
      type: DeploymentType.TRANSACTION,
      status: DeploymentStatus.PENDING,
      contractName: ContractNames.ERC725_Account,
      functionName: 'setDataAndTransferOwnership',
    });

    try {
      await setDataAndTransferOwnership(
        publicClient,
        walletClient,
        upAddress,
        kmAddress,
        profileDeploymentOptions.controllerAddresses,
        urdAddress,
        profileDeploymentOptions.lsp3DataValue
      );
    } catch (error) {
      onDeployEvents?.error?.(error);
      throw error;
    }

    emitEvent({
      type: DeploymentType.TRANSACTION,
      status: DeploymentStatus.COMPLETE,
      contractName: ContractNames.ERC725_Account,
      functionName: 'setDataAndTransferOwnership',
    });

    const contracts: DeployedUniversalProfileContracts = {
      LSP0ERC725Account: {
        address: upAddress,
        receipt: deployReceipt,
      },
      LSP6KeyManager: {
        address: kmAddress,
        receipt: deployReceipt,
      },
    };

    onDeployEvents?.complete?.(contracts);

    return contracts;
  }

  /**
   * Pre-computes the UP and KeyManager addresses that would result from
   * a deployment with the given parameters.
   */
  async computeAddress(
    _profileDeploymentOptions: Pick<ProfileDeploymentOptions, 'controllerAddresses'>,
    contractDeploymentOptions?: Pick<ContractDeploymentOptions, 'version' | 'salt'>
  ): Promise<{ upAddress: Hex; keyManagerAddress: Hex }> {
    const { publicClient } = this.options;
    const { lsp23Params } = this.buildDeployParams(contractDeploymentOptions);

    const { upAddress, kmAddress } = await computeAddressesViaLSP23(publicClient, lsp23Params);

    return { upAddress, keyManagerAddress: kmAddress };
  }
}
