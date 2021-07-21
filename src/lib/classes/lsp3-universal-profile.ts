import { ethers } from 'ethers';
import { solidityKeccak256 } from 'ethers/lib/utils';
import {
  ERC725Account,
  UniversalReceiverAddressStore__factory,
  BasicKeyManager,
  BasicKeyManager__factory,
  ERC725Account__factory,
} from '../../types/ethers-v5';
import { getERC725 } from '../helpers/erc725';
import { LSP3ProfileJSON } from '../interfaces/lsp3-profile';

export class LSP3UniversalProfile {
  options: any;
  constructor(options: any) {
    this.options = options;
  }
  async deploy(options: { controllerAddresses: string[]; lsp3ProfileJson?: LSP3ProfileJSON }) {
    const signer = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      this.options.provider
    );

    // 1 > deploys ERC725Account
    const erc725Account = await this.deployERC725Account(signer);

    // 2 > deploys KeyManager
    const basicKeyManager = await this.deployKeyManager(signer, erc725Account.address);

    // 3 > deploys UniversalReceiverDelegate
    const universalReceiverAddressStore = await this.deployUniversalReceiverAddressStore(
      signer,
      erc725Account
    );

    // 4 > sets LSP3Profile data
    if (options.lsp3ProfileJson) {
      await this.setLSP3Profile(erc725Account, options.lsp3ProfileJson);
    }

    // 5 > transfersOwnership to KeyManager
    await this.transferOwnership(erc725Account, basicKeyManager);

    return { erc725Account, basicKeyManager, universalReceiverAddressStore };
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

  private async deployUniversalReceiverAddressStore(
    signer: ethers.Wallet,
    erc725Account: ERC725Account
  ) {
    const universalReceiverAddressStoreFactory = new UniversalReceiverAddressStore__factory(signer);
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

  private async transferOwnership(erc725Account: ERC725Account, basicKeyManager: BasicKeyManager) {
    try {
      const transferOwnershipTransaction = await erc725Account.transferOwnership(
        basicKeyManager.address,
        { from: this.options.deployFrom, gasPrice: 80, gasLimit: 6_721_975 }
      );
      return await transferOwnershipTransaction.wait();
    } catch (error) {
      console.error('Error when transferring Ownership', error);
      throw error;
    }
  }

  private async setLSP3Profile(erc725Account: ERC725Account, lsp3ProfileJson: LSP3ProfileJSON) {
    try {
      const myERC725 = getERC725();
      const encodedLSP3Profile = myERC725.encodeData('LSP3Profile', {
        hashFunction: 'keccak256(utf8)',
        hash: solidityKeccak256(['string'], [JSON.stringify(lsp3ProfileJson)]),
        url: 'ifps://QmbKvCVEePiDKxuouyty9bMsWBAxZDGr2jhxd4pLGLx95D',
      });

      const transaction = await erc725Account.setData(
        '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5', // LSP3Profile
        encodedLSP3Profile,
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

  private async deployKeyManager(signer: ethers.Wallet, address: string) {
    try {
      const basicKeyManagerFactory = new BasicKeyManager__factory(signer);
      const basicKeyManager = await basicKeyManagerFactory.deploy(address, {
        gasPrice: 80,
        gasLimit: 6_721_975,
      });
      await basicKeyManager.deployed();
      return basicKeyManager;
    } catch (error) {
      console.error('Error when deploying KeyManager', error);
      throw error;
    }
  }

  private async deployERC725Account(signer: ethers.Wallet) {
    try {
      const erc725AccountFactory = new ERC725Account__factory(signer);
      const erc725Account = await erc725AccountFactory.deploy(this.options.deployFrom, {
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
