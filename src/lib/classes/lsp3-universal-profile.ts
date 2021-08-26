import { ethers, Wallet } from 'ethers';

import {
  ERC725Account,
  ERC725Account__factory,
  KeyManager,
  KeyManager__factory,
  UniversalReceiverAddressStore__factory,
} from '../../../types/ethers-v5';
import { defaultUploadOptions } from '../helpers/config';
import { encodeLSP3Profile } from '../helpers/erc725';
import { imageUpload, ipfsUpload } from '../helpers/uploader';
import {
  LSP3ProfileJSON,
  LSPFactoryOptions,
  ProfileDataBeforeUpload,
  ProfileDeploymentOptions,
} from '../interfaces';
import { ProfileUploadOptions } from '../interfaces/profile-upload-options';

export class LSP3UniversalProfile {
  options: LSPFactoryOptions;
  signer: Wallet;

  constructor(options: LSPFactoryOptions) {
    this.options = options;
    this.signer = new ethers.Wallet(this.options.deployKey, this.options.provider);
  }

  async deploy(profileDeployment: ProfileDeploymentOptions) {
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

    return {
      erc725Account,
      keyManager,
      universalReceiverAddressStore,
    };
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

  /**
   * Uploads the LSP3Profile to the desired endpoint. This can be an `https` URL either pointing to
   * a public, centralized storage endpoint or an IPFS Node / Cluster
   *
   * @param {ProfileDataBeforeUpload} profileData
   * @return {*}  {(Promise<AddResult | string>)}
   * @memberof LSP3UniversalProfile
   */
  static async uploadProfileData(
    profileData: ProfileDataBeforeUpload,
    uploadOptions?: ProfileUploadOptions
  ): Promise<{ profile: LSP3ProfileJSON; url: string }> {
    uploadOptions = uploadOptions || defaultUploadOptions;

    const profileImage = profileData.profileImage
      ? await imageUpload(profileData.profileImage, uploadOptions)
      : null;

    const backgroundImage = profileData.backgroundImage
      ? await imageUpload(profileData.backgroundImage, uploadOptions)
      : null;

    const profile = {
      LSP3Profile: {
        ...profileData,
        profileImage,
        backgroundImage,
      },
    };

    // TODO: allow simple http upload too
    const url = await ipfsUpload(JSON.stringify(profile), uploadOptions.ipfsClientOptions);

    return {
      profile,
      url: url.cid ? 'ipfs://' + url.cid : 'https upload TBD',
    };
  }

  private async deployUniversalReceiverAddressStore(erc725Account: ERC725Account) {
    const universalReceiverAddressStoreFactory = new UniversalReceiverAddressStore__factory(
      this.signer
    );
    const universalReceiverAddressStore = await universalReceiverAddressStoreFactory.deploy(
      erc725Account.address
    );
    await universalReceiverAddressStore.deployed();
    return universalReceiverAddressStore;
  }

  private async transferOwnership(erc725Account: ERC725Account, keyManager: KeyManager) {
    try {
      const transferOwnershipTransaction = await erc725Account.transferOwnership(
        keyManager.address,
        {
          from: this.signer.address,
        }
      );
      return await transferOwnershipTransaction.wait();
    } catch (error) {
      console.error('Error when transferring Ownership', error);
      throw error;
    }
  }

  private async setLSP3Profile(
    erc725Account: ERC725Account,
    lsp3ProfileData: LSP3ProfileJSON,
    url: string
  ) {
    try {
      const encodedData = encodeLSP3Profile(lsp3ProfileData, url);
      const transaction = await erc725Account.setData(
        encodedData.LSP3Profile.key,
        encodedData.LSP3Profile.value
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
      const keyManager = await keyManagerFactory.deploy(address);
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
      const erc725Account = await erc725AccountFactory.deploy(ownerAddress);
      await erc725Account.deployed();

      return erc725Account;
    } catch (error) {
      console.error('Error when deploying ERC725Account', error);
      throw error;
    }
  }
}
