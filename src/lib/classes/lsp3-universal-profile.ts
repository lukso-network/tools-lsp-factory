import { NonceManager } from '@ethersproject/experimental';
import { concat, Observable } from 'rxjs';
import { concatAll } from 'rxjs/operators';

import contractVersions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import { defaultUploadOptions } from '../helpers/config.helper';
import { waitForContractDeployment$ } from '../helpers/deployment.helper';
import { ipfsUpload, prepareMetadataImage } from '../helpers/uploader.helper';
import {
  DeploymentEventContract,
  DeploymentEventTransaction,
  LSPFactoryOptions,
  ProfileDataBeforeUpload,
  ProfileDeploymentOptions,
} from '../interfaces';
import { LSP3ProfileDataForEncoding } from '../interfaces/lsp3-profile';
import {
  ContractDeploymentOptionsNonReactive,
  ContractDeploymentOptionsReactive,
  DeployedContracts,
} from '../interfaces/profile-deployment';
import { UploadOptions } from '../interfaces/profile-upload-options';
import {
  shouldDeployUniversalProfileBaseContracts$,
  universalProfileBaseContractAddresses$,
  universalProfileBaseContractsDeployment$,
} from '../services/base-contract.service';
import { keyManagerDeployment$ } from '../services/key-manager.service';

import {
  accountDeployment$,
  getTransferOwnershipTransaction$,
  lsp3ProfileUpload$,
  setDataTransaction$,
} from './../services/lsp3-account.service';
import { universalReceiverDelegateDeployment$ } from './../services/universal-receiver.service';

type ObservableOrPromise<
  T extends ContractDeploymentOptionsReactive | ContractDeploymentOptionsNonReactive
> = T extends ContractDeploymentOptionsReactive
  ? Observable<DeploymentEventContract | DeploymentEventTransaction>
  : Promise<DeployedContracts>;

/**
 * Class responsible for deploying UniversalProfiles and uploading LSP3 metadata to IPFS
 *
 * @property {LSPFactoryOptions} options
 * @property {NonceManager} signer
 * @memberof LSPFactory
 */
export class LSP3UniversalProfile {
  options: LSPFactoryOptions;
  signer: NonceManager;
  constructor(options: LSPFactoryOptions) {
    this.options = options;
    this.signer = new NonceManager(options.signer);
  }

  /**
   * Deploys a UniversalProfile and uploads LSP3 Profile data to IPFS
   *
   *  Returns a Promise with deployed contract details or an RxJS Observable of transaction details if `deployReactive` flag is set to true
   *
   * @param {ProfileDeploymentOptions} profileData
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Promise<DeployedContracts> | Observable<LSP3AccountDeploymentEvent | DeploymentEventTransaction>
   * @memberof LSP3UniversalProfile
   *
   * @example
   * ```javascript
   *lspFactory.LSP3UniversalProfile.deploy({
   *    controllingAccounts: ['0xb74a88C43BCf691bd7A851f6603cb1868f6fc147'],
   *    lsp3Profile: myUniversalProfileData
   *  });
   *};
   * ```
   */
  deploy<
    T extends
      | ContractDeploymentOptionsReactive
      | ContractDeploymentOptionsNonReactive = ContractDeploymentOptionsNonReactive
  >(
    profileDeploymentOptions: ProfileDeploymentOptions,
    contractDeploymentOptions?: T
  ): ObservableOrPromise<T> {
    // -1 > Run IPFS upload process in parallel with contract deployment
    const lsp3Profile$ = lsp3ProfileUpload$(
      profileDeploymentOptions.lsp3Profile,
      contractDeploymentOptions?.uploadOptions ?? this.options.uploadOptions
    );

    const defaultContractVersion = contractDeploymentOptions?.version ?? DEFAULT_CONTRACT_VERSION;

    // 0 > Check for existing base contracts and deploy
    const defaultUPBaseContractAddress =
      contractDeploymentOptions?.ERC725Account?.libAddress ??
      contractVersions[this.options.chainId]?.contracts?.ERC725Account?.versions[
        contractDeploymentOptions?.ERC725Account?.version ?? defaultContractVersion
      ];
    const defaultUniversalReceiverAddress =
      contractDeploymentOptions?.UniversalReceiverDelegate?.libAddress ??
      contractVersions[this.options.chainId]?.contracts?.UniversalReceiverDelegate?.versions[
        contractDeploymentOptions?.UniversalReceiverDelegate?.version ?? defaultContractVersion
      ];
    const defaultKeyManagerBaseContractAddress =
      contractDeploymentOptions?.KeyManager?.libAddress ??
      contractVersions[this.options.chainId]?.contracts?.KeyManager?.versions[
        contractDeploymentOptions?.KeyManager?.version ?? defaultContractVersion
      ];

    const baseContractsToDeploy$ = shouldDeployUniversalProfileBaseContracts$(
      defaultUPBaseContractAddress,
      defaultUniversalReceiverAddress,
      defaultKeyManagerBaseContractAddress,
      this.options.provider,
      this.options.chainId,
      contractDeploymentOptions
    );

    const baseContractDeployment$ = universalProfileBaseContractsDeployment$(
      this.signer,
      baseContractsToDeploy$
    );

    const deployUniversalReceiverProxy =
      typeof contractDeploymentOptions?.UniversalReceiverDelegate?.deployProxy === 'undefined'
        ? contractVersions[this.options.chainId]?.contracts?.UniversalReceiverDelegate?.baseContract
        : contractDeploymentOptions?.UniversalReceiverDelegate?.deployProxy;

    const baseContractAddresses$ = universalProfileBaseContractAddresses$(
      baseContractDeployment$,
      defaultUPBaseContractAddress,
      defaultKeyManagerBaseContractAddress,
      contractDeploymentOptions,
      deployUniversalReceiverProxy
    );

    const controllerAddresses = profileDeploymentOptions.controllerAddresses.map((controller) => {
      return typeof controller === 'string' ? controller : controller.address;
    });

    // 1 > deploys ERC725Account
    const account$ = accountDeployment$(
      this.signer,
      controllerAddresses,
      baseContractAddresses$,
      contractDeploymentOptions?.ERC725Account?.byteCode
    );

    // 2 > deploys KeyManager
    const keyManager$ = keyManagerDeployment$(
      this.signer,
      account$,
      baseContractAddresses$,
      contractDeploymentOptions?.KeyManager?.byteCode
    );

    // 3 > deploys UniversalReceiverDelegate
    const universalReceiver$ = universalReceiverDelegateDeployment$(
      this.signer,
      this.options.provider,
      baseContractAddresses$,
      contractDeploymentOptions?.UniversalReceiverDelegate?.libAddress,
      contractVersions[this.options.chainId]?.contracts?.UniversalReceiverDelegate?.versions[
        contractDeploymentOptions?.UniversalReceiverDelegate?.version ?? defaultContractVersion
      ],
      contractDeploymentOptions?.UniversalReceiverDelegate?.byteCode
    );

    // 4 > set permissions, profile and universal
    const setData$ = setDataTransaction$(
      this.signer,
      account$,
      universalReceiver$,
      profileDeploymentOptions.controllerAddresses,
      lsp3Profile$,
      defaultUniversalReceiverAddress
    );

    // 5 > transfersOwnership to KeyManager
    const transferOwnership$ = getTransferOwnershipTransaction$(this.signer, account$, keyManager$);

    const deployment$ = concat([
      baseContractDeployment$,
      account$,
      universalReceiver$,
      keyManager$,
      setData$,
      transferOwnership$,
    ]).pipe(concatAll());

    if (contractDeploymentOptions?.deployReactive) return deployment$ as ObservableOrPromise<T>;

    return waitForContractDeployment$(deployment$) as ObservableOrPromise<T>;
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
   * a public, centralized storage endpoint or an IPFS Node / Cluster.
   *
   * Will upload and process passed images.
   *
   * @param {ProfileDataBeforeUpload} profileData
   * @return {*}  {(Promise<AddResult | string>)} Returns processed LSP3 Data and upload url
   * @memberof LSP3UniversalProfile
   */
  static async uploadProfileData(
    profileData: ProfileDataBeforeUpload,
    uploadOptions?: UploadOptions
  ): Promise<LSP3ProfileDataForEncoding> {
    uploadOptions = uploadOptions || defaultUploadOptions;
    const [profileImage, backgroundImage] = await Promise.all([
      prepareMetadataImage(uploadOptions, profileData.profileImage),
      prepareMetadataImage(uploadOptions, profileData.backgroundImage),
    ]);

    const profile = {
      LSP3Profile: {
        ...profileData,
        profileImage,
        backgroundImage,
      },
    };

    let uploadResponse;
    if (uploadOptions.url) {
      // TODO: simple HTTP upload
    } else {
      uploadResponse = await ipfsUpload(JSON.stringify(profile), uploadOptions.ipfsClientOptions);
    }

    return {
      profile,
      url: uploadResponse.cid ? 'ipfs://' + uploadResponse.cid : 'https upload TBD',
    };
  }

  /**
   * Uploads the LSP3Profile to the desired endpoint. This can be an `https` URL either pointing to
   * a public, centralized storage endpoint or an IPFS Node / Cluster.
   *
   * Will upload and process passed images.
   *
   * Uses UploadOptions specified when instantiating LSPFactory instance.
   *
   * @param {ProfileDataBeforeUpload} profileData
   * @return {*}  {(Promise<AddResult | string>)} Returns processed LSP3 Data and upload url
   * @memberof LSP3UniversalProfile
   */
  async uploadProfileData(profileData: ProfileDataBeforeUpload, uploadOptions?: UploadOptions) {
    const uploadOptionsToUse = uploadOptions || this.options.uploadOptions || defaultUploadOptions;
    return LSP3UniversalProfile.uploadProfileData(profileData, uploadOptionsToUse);
  }
}
