import { Signer } from 'ethers';
import { combineLatest, concat, defer, Observable } from 'rxjs';
import { concatAll, scan, shareReplay, switchMap, take, withLatestFrom } from 'rxjs/operators';

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
  DeploymentEvent$,
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
    const { accountDeployment$, accountDeploymentReceipt$ } = this.getAccountDeploymentObservable();

    // 2 > deploys KeyManager
    const { keyManagerDeployment$, keyManagerReceipt$ } =
      this.getKeyManagerDeployment$(accountDeployment$);

    // // 3 > deploys UniversalReceiverDelegate
    const { universalReceiverAddressStoreDeployment$, universalReceiverAddressStoreReceipt$ } =
      this.getUniversalReceiverAddressStoreDeployment$(accountDeployment$);

    // // 4 > set permissions
    const { setDataTransaction$, setDataReceipt$ } = this.getSetDataTransaction$(
      accountDeployment$,
      universalReceiverAddressStoreDeployment$,
      profileDeploymentOptions
    );

    // // // 5 > transfersOwnership to KeyManager
    const { transferOwnershipTransaction$, transferOwnershipReceipt$ } =
      this.getTransferOwnershipTransaction$(accountDeployment$, keyManagerDeployment$);

    return concat([
      accountDeployment$,
      accountDeploymentReceipt$,
      keyManagerDeployment$,
      keyManagerReceipt$,
      universalReceiverAddressStoreDeployment$,
      universalReceiverAddressStoreReceipt$,
      setDataTransaction$,
      setDataReceipt$,
      transferOwnershipTransaction$,
      transferOwnershipReceipt$,
    ]).pipe(
      concatAll(),
      scan((accumulator, deploymentEvent: any) => {
        accumulator[deploymentEvent.name] = deploymentEvent;
        return accumulator;
      }, {}),
      take(12)
    );
  }

  private getTransferOwnershipTransaction$(
    accountDeployment$: DeploymentEvent$<LSP3Account>,
    keyManagerDeployment$: DeploymentEvent$<KeyManager>
  ) {
    const transferOwnershipTransaction$ = combineLatest([
      accountDeployment$,
      keyManagerDeployment$,
    ]).pipe(
      switchMap(([{ contract: lsp3AccountContract }, { contract: keyManagerContract }]) => {
        return this.transferOwnership(lsp3AccountContract, keyManagerContract);
      }),
      shareReplay()
    );
    const transferOwnershipReceipt$ = waitForReceipt(transferOwnershipTransaction$);
    return { transferOwnershipTransaction$, transferOwnershipReceipt$ };
  }

  private getSetDataTransaction$(
    accountDeployment$: DeploymentEvent$<LSP3Account>,
    universalReceiverAddressStoreDeployment$: DeploymentEvent$<UniversalReceiverAddressStore>,
    profileDeploymentOptions: ProfileDeploymentOptions
  ) {
    const setDataTransaction$ = accountDeployment$.pipe(
      withLatestFrom(universalReceiverAddressStoreDeployment$),
      switchMap(
        ([{ contract: lsp3AccountContract }, { contract: universalReceiverAddressStore }]) => {
          return this.setData(
            lsp3AccountContract,
            universalReceiverAddressStore,
            profileDeploymentOptions
          );
        }
      ),
      shareReplay()
    );

    const setDataReceipt$ = waitForReceipt(setDataTransaction$);
    return { setDataTransaction$, setDataReceipt$ };
  }

  private getUniversalReceiverAddressStoreDeployment$(
    accountDeployment$: Observable<DeploymentEventContract<LSP3Account>>
  ) {
    const universalReceiverAddressStoreDeployment$ = accountDeployment$.pipe(
      switchMap(({ contract: lsp3AccountContract }) => {
        return deployUniversalReceiverAddressStore(this.signer, lsp3AccountContract.address);
      }),
      shareReplay()
    );

    const universalReceiverAddressStoreReceipt$ = waitForReceipt(
      universalReceiverAddressStoreDeployment$
    );
    return { universalReceiverAddressStoreDeployment$, universalReceiverAddressStoreReceipt$ };
  }

  private getKeyManagerDeployment$(
    accountDeployment$: Observable<DeploymentEventContract<LSP3Account>>
  ) {
    const keyManagerDeployment$ = accountDeployment$.pipe(
      switchMap(({ contract: lsp3AccountContract }) => {
        return deployKeyManager(this.signer, lsp3AccountContract.address);
      }),
      shareReplay()
    );

    const keyManagerReceipt$ = waitForReceipt(keyManagerDeployment$);
    return { keyManagerDeployment$, keyManagerReceipt$ };
  }

  /**
   * TODO: docs
   */
  private getAccountDeploymentObservable() {
    const accountDeployment$ = defer(() =>
      deployLSP3Account(this.signer, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    ).pipe(shareReplay());

    const accountDeploymentReceipt$ = waitForReceipt(accountDeployment$);
    return { accountDeployment$, accountDeploymentReceipt$ };
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
    universalReceiverAddressStore: UniversalReceiverAddressStore,
    profileDeploymentOptions: ProfileDeploymentOptions
  ) {
    const { json, url } = profileDeploymentOptions.lsp3Profile;
    const encodedData = encodeLSP3Profile({ ...json }, url);
    const transaction = await erc725Account.setDataMultiple(
      [
        LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY,
        LSP3_UP_KEYS.LSP3_PROFILE,
        PREFIX_PERMISSIONS + profileDeploymentOptions.controllerAddresses[0].substr(2), // TODO: handle multiple addresses
      ],
      [universalReceiverAddressStore.address, encodedData.LSP3Profile.value, ALL_PERMISSIONS]
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
        transaction: transferOwnershipTransaction,
      };
    } catch (error) {
      console.error('Error when transferring Ownership', error);
      throw error;
    }
  }
}
