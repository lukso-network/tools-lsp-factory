import { ethers, Wallet } from 'ethers';

import {
  ERC725Account,
  ERC725Account__factory,
  KeyManager,
  KeyManager__factory,
  UniversalReceiverAddressStore__factory,
} from '../../../types/ethers-v5';
import { encodeLSP3Profile } from '../helpers/erc725';
import {
  ContractOptions,
  LSP3ProfileJSON,
  LSPFactoryOptions,
  ProfileDeploymentOptions,
} from '../interfaces';

export class LSP3UniversalProfile {
  options: any;
  signer: Wallet;

  constructor(options: LSPFactoryOptions) {
    this.options = options;
    this.signer = new ethers.Wallet(this.options.deployKey, this.options.provider);
  }

  async deploy(profileDeployment: ProfileDeploymentOptions, _contractOptions?: ContractOptions) {
    // 1 > deploys ERC725Account
    const erc725Account = await this.deployERC725Account(profileDeployment.controllerAddresses[0]);

    // 2 > deploys KeyManager
    const keyManager = await this.deployKeyManager(erc725Account.address);

    // 3 > deploys UniversalReceiverDelegate
    const universalReceiverAddressStore = await this.deployUniversalReceiverAddressStore(
      erc725Account
    );

    // 4 > sets LSP3Profile data
    if (profileDeployment.lsp3ProfileJson) {
      // TODO: upload json somewhere
      const url = 'ifps://QmbKvCVEePiDKxuouyty9bMsWBAxZDGr2jhxd4pLGLx95D';

      await this.setLSP3Profile(erc725Account, profileDeployment.lsp3ProfileJson, url);
    }

    // 5 > transfersOwnership to KeyManager
    await this.transferOwnership(erc725Account, keyManager);

    return { erc725Account, basicKeyManager: keyManager, universalReceiverAddressStore };
  }

  /**
   * Pre-deploys the latest Version of the LSP3UniversalProfile smart-contracts.
   *
   * @param {'string'} [version] Instead of deploying the latest Version you can also deploy a specific
   *  version of the smart-contracts. A list of all available version is available here.
   */
  async preDeployContracts(version?: 'string') {
    console.log(version);
  }

  private async deployUniversalReceiverAddressStore(erc725Account: ERC725Account) {
    const universalReceiverAddressStoreFactory = new UniversalReceiverAddressStore__factory(
      this.signer
    );
    const universalReceiverAddressStore = await universalReceiverAddressStoreFactory.deploy(
      erc725Account.address,
      {
        gasPrice: 80,
        gasLimit: 6_721_975,
      }
    );
    await universalReceiverAddressStore.deployed();
    return universalReceiverAddressStore;
  }

  private async transferOwnership(erc725Account: ERC725Account, keyManager: KeyManager) {
    try {
      const transferOwnershipTransaction = await erc725Account.transferOwnership(
        keyManager.address,
        { from: this.options.deployFrom, gasPrice: 80, gasLimit: 6_721_975 }
      );
      return await transferOwnershipTransaction.wait();
    } catch (error) {
      console.error('Error when transferring Ownership', error);
      throw error;
    }
  }

  private async setLSP3Profile(
    erc725Account: ERC725Account,
    lsp3ProfileJson: LSP3ProfileJSON,
    url: string
  ) {
    try {
      const transaction = await erc725Account.setData(
        '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5', // LSP3Profile
        encodeLSP3Profile(lsp3ProfileJson, url),
        {
          gasPrice: 80,
          gasLimit: 6_721_975,
        }
      );
      return await transaction.wait();
    } catch (error) {
      console.error('Error when setting LSP3Profile', error);
      throw error;
    }
  }

  private async deployKeyManager(address: string) {
    try {
      const keyManagerFactory = new KeyManager__factory(this.signer);
      const keyManager = await keyManagerFactory.deploy(address, {
        gasPrice: 80,
        gasLimit: 6_721_975,
      });
      await keyManager.deployed();
      return keyManager;
    } catch (error) {
      console.error('Error when deploying KeyManager', error);
      throw error;
    }
  }

  private async deployERC725Account(ownerAddress: string) {
    try {
      const erc725AccountFactory = new ERC725Account__factory(this.signer);
      const erc725Account = await erc725AccountFactory.deploy(ownerAddress, {
        gasPrice: 80,
        gasLimit: 6_721_975,
      });
      await erc725Account.deployed();

      return erc725Account;
    } catch (error) {
      console.error('Error when deploying ERC725Account', error);
      throw error;
    }
  }
}
