import { Signer } from 'ethers';
import { combineLatest, concat, defer, Observable } from 'rxjs';
import { concatAll, scan, shareReplay, switchMap, take } from 'rxjs/operators';

import { KeyManager, LSP3Account, UniversalReceiverAddressStore } from '../../../types/ethers-v5';
import {
  ALL_PERMISSIONS,
  defaultUploadOptions,
  LSP3_UP_KEYS,
  PREFIX_PERMISSIONS,
} from '../helpers/config.helper';
import {
  deployKeyManager,
  deployLSP3Account,
  deployUniversalReceiverAddressStore,
  waitForReceipt,
} from '../helpers/deployment.helper';
import { encodeLSP3Profile } from '../helpers/erc725.helper';
import { imageUpload, ipfsUpload } from '../helpers/uploader.helper';
import {
  LSP3ProfileJSON,
  LSPFactoryOptions,
  ProfileDataBeforeUpload,
  ProfileDeploymentOptions,
} from '../interfaces';
import {
  DEPLOYMENT_EVENT,
  DeploymentEventContract,
} from '../interfaces/profile-deployment-options';
import { ProfileUploadOptions } from '../interfaces/profile-upload-options';

/**
 * TODO: docs
 */
export class LSP3UniversalProfile {
  options: LSPFactoryOptions;
  signer: Signer;
  constructor(options: LSPFactoryOptions) {
    this.options = options;
    this.signer = this.options.provider.getSigner();
  }

  /**
   * TODO: docs
   */
  deploy(profileDeploymentOptions: ProfileDeploymentOptions) {
    // 1 > deploys ERC725Account
    const accountDeployment$ = this.getAccountDeploymentObservable();

    // 2 > deploys KeyManager
    const keyManagerDeployment$ = this.getKeyManagerDeployment$(accountDeployment$);

    // 3 > deploys UniversalReceiverDelegate
    const universalReceiverAddressStoreDeployment$ =
      this.getUniversalReceiverAddressStoreDeployment$(accountDeployment$);

    // 4 > set permissions
    const setData$ = this.getSetDataTransaction$(
      accountDeployment$,
      universalReceiverAddressStoreDeployment$,
      profileDeploymentOptions
    );

    // // 5 > transfersOwnership to KeyManager
    const transferOwnership$ = this.getTransferOwnershipTransaction$(
      accountDeployment$,
      keyManagerDeployment$
    );

    return concat([
      accountDeployment$,
      keyManagerDeployment$,
      universalReceiverAddressStoreDeployment$,
      setData$,
      transferOwnership$,
    ]).pipe(
      concatAll(),
      scan((accumulator, deploymentEvent: any) => {
        console.log('deploymentEvent');
        console.log(deploymentEvent);
        accumulator[deploymentEvent.name] = deploymentEvent;
        return accumulator;
      }, {}),
      take(12)
    );
  }

  private getTransferOwnershipTransaction$(
    accountDeployment$: Observable<any>,
    keyManagerDeployment$: Observable<any>
  ) {
    const transaction$ = combineLatest([accountDeployment$, keyManagerDeployment$]).pipe(
      switchMap(([{ contract: lsp3AccountContract }, { contract: keyManagerContract }]) => {
        return this.transferOwnership(lsp3AccountContract, keyManagerContract);
      })
    );

    return waitForReceipt(transaction$);
  }

  private getSetDataTransaction$(
    accountDeployment$: Observable<any>,
    universalReceiverAddressStoreDeployment$: Observable<any>,
    profileDeploymentOptions: ProfileDeploymentOptions
  ) {
    const setDataTransaction$ = combineLatest([
      accountDeployment$,
      universalReceiverAddressStoreDeployment$,
    ]).pipe(
      switchMap(
        ([{ contract: lsp3AccountContract }, { contract: universalReceiverAddressStore }]) => {
          return this.setData(
            lsp3AccountContract,
            universalReceiverAddressStore,
            profileDeploymentOptions.lsp3Profile
          );
        }
      )
    );

    return waitForReceipt(setDataTransaction$);
  }

  private getUniversalReceiverAddressStoreDeployment$(accountDeployment$: Observable<any>) {
    const deployment$ = accountDeployment$.pipe(
      switchMap(({ contract: lsp3AccountContract }) => {
        return deployUniversalReceiverAddressStore(this.signer, lsp3AccountContract.address);
      })
    );

    return waitForReceipt(deployment$);
  }

  private getKeyManagerDeployment$(
    accountDeployment$: Observable<DeploymentEventContract<LSP3Account>>
  ) {
    const keyManagerDeployment$ = accountDeployment$.pipe(
      switchMap(({ contract: lsp3AccountContract }) => {
        return deployKeyManager(this.signer, lsp3AccountContract.address);
      })
    );

    const keyManagerReceipt$ = waitForReceipt(keyManagerDeployment$);
    return concat(keyManagerDeployment$, keyManagerReceipt$).pipe(shareReplay());
  }

  /**
   * TODO: docs
   */
  private getAccountDeploymentObservable() {
    const accountDeployment$ = defer(() =>
      deployLSP3Account(this.signer, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    );

    const accountDeploymentReceipt$ = waitForReceipt(accountDeployment$);
    return concat(accountDeployment$, accountDeploymentReceipt$).pipe(shareReplay());
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

  /**
   * TODO: docs
   */
  private async setData(
    erc725Account: LSP3Account,
    universalReceiverAddressStoreContract: UniversalReceiverAddressStore,
    profileData: { json: LSP3ProfileJSON; url: string }
  ) {
    const encodedData = encodeLSP3Profile(profileData.json, profileData.url);
    const signerAddress = await this.signer.getAddress();

    const transaction = await erc725Account.setDataMultiple(
      [
        LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY,
        LSP3_UP_KEYS.LSP3_PROFILE,
        PREFIX_PERMISSIONS + signerAddress.substr(2),
      ],
      [universalReceiverAddressStoreContract.address, encodedData.LSP3Profile, ALL_PERMISSIONS]
    );

    return {
      type: DEPLOYMENT_EVENT.TRANSACTION,
      name: 'SET_DATA',
      transaction,
    };
  }

  /**
   * TODO: docs
   */
  private async transferOwnership(lsp3Account: LSP3Account, keyManager: KeyManager) {
    try {
      const transferOwnershipTransaction = await lsp3Account.transferOwnership(keyManager.address, {
        from: await this.signer.getAddress(),
      });
      return {
        type: DEPLOYMENT_EVENT.TRANSACTION,
        name: 'TRANSFER_OWNERSHIP',
        receipt: await transferOwnershipTransaction.wait(),
      };
    } catch (error) {
      console.error('Error when transferring Ownership', error);
      throw error;
    }
  }

  // private async setLSP3Profile(
  //   lsp3Account: LSP3Account,
  //   lsp3ProfileData: LSP3ProfileJSON,
  //   url: string
  // ) {
  //   try {
  //     const encodedData = encodeLSP3Profile(lsp3ProfileData, url);
  //     const transaction = await lsp3Account.setData(
  //       encodedData.LSP3Profile.key,
  //       encodedData.LSP3Profile.value
  //     );
  //     return {
  //       type: DEPLOYMENT_EVENT_TYPE.TRANSACTION,
  //       name: 'SET_LSP3PROFILE',
  //       transaction,
  //     };
  //   } catch (error) {
  //     console.error('Error when setting LSP3Profile', error);
  //     throw error;
  //   }
  // }
}
