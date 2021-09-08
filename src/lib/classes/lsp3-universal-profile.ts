import { NonceManager } from '@ethersproject/experimental';
import { Signer } from 'ethers';
import { concat, merge } from 'rxjs';
import { concatAll } from 'rxjs/operators';

import { defaultUploadOptions } from '../helpers/config.helper';
import { imageUpload, ipfsUpload } from '../helpers/uploader.helper';
import {
  LSP3ProfileJSON,
  LSPFactoryOptions,
  ProfileDataBeforeUpload,
  ProfileDeploymentOptions,
} from '../interfaces';
import { ContractDeploymentOptions } from '../interfaces/profile-deployment';
import { ProfileUploadOptions } from '../interfaces/profile-upload-options';
import { keyManagerDeployment$ } from '../services/key-manager.service';

import {
  accountDeployment$,
  getTransferOwnershipTransaction$,
  setDataTransaction$,
} from './../services/lsp3-account.service';
import { universalReceiverAddressStoreDeployment$ } from './../services/universal-receiver.service';

/**
 * TODO: docs
 */
export class LSP3UniversalProfile {
  options: LSPFactoryOptions;
  signer: Signer;
  constructor(options: LSPFactoryOptions) {
    this.options = options;
    this.signer = new NonceManager(options.signer);
  }

  /**
   * TODO: docs
   */
  deploy(
    profileDeploymentOptions: ProfileDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    // 1 > deploys ERC725Account
    const account$ = accountDeployment$(
      this.signer,
      profileDeploymentOptions.controllerAddresses,
      contractDeploymentOptions?.libAddresses?.lsp3AccountInit
    );

    // 2 > deploys KeyManager
    const keyManager$ = keyManagerDeployment$(
      this.signer,
      account$,
      contractDeploymentOptions?.libAddresses?.keyManagerInit
    );

    // 3 > deploys UniversalReceiverDelegate
    const universalReceiver$ = universalReceiverAddressStoreDeployment$(
      this.signer,
      account$,
      contractDeploymentOptions?.libAddresses?.universalReceiverAddressStoreInit
    );

    // // 4 > set permissions, profile and universal
    const setData$ = setDataTransaction$(
      this.signer,
      account$,
      universalReceiver$,
      profileDeploymentOptions
    );

    // 5 > transfersOwnership to KeyManager
    const transferOwnership$ = getTransferOwnershipTransaction$(this.signer, account$, keyManager$);

    return concat([
      account$,
      merge(universalReceiver$, keyManager$),
      setData$,
      transferOwnership$,
    ]).pipe(
      concatAll()
      // scan((accumulator, deploymentEvent: DeploymentEvent<Contract>) => {
      //   accumulator[deploymentEvent.name] = deploymentEvent;
      //   return accumulator;
      // }, {} as DeploymentEvent<Contract>)
    );
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
    const uploadResponse = await ipfsUpload(
      JSON.stringify(profile),
      uploadOptions.ipfsClientOptions
    );

    return {
      profile,
      url: uploadResponse.cid ? 'ipfs://' + uploadResponse.cid : 'https upload TBD',
    };
  }
}
