import { NonceManager } from '@ethersproject/experimental';
import { concat, lastValueFrom, merge, Observable } from 'rxjs';
import { concatAll } from 'rxjs/operators';

import contractVersions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import { defaultUploadOptions } from '../helpers/config.helper';
import { deploymentWithContractsOnCompletion$ } from '../helpers/deployment.helper';
import { ipfsUpload, prepareMetadataImage } from '../helpers/uploader.helper';
import {
  DeploymentEventContract,
  DeploymentEventTransaction,
  LSPFactoryOptions,
  ProfileDataBeforeUpload,
  ProfileDeploymentOptions,
} from '../interfaces';
import { ProfileDataForEncoding } from '../interfaces/lsp3-profile';
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
  convertUniversalProfileConfigurationObject,
  isSignerUniversalProfile$,
  lsp3ProfileUpload$,
  setDataAndTransferOwnershipTransactions$,
} from '../services/lsp3-account.service';
import { universalReceiverDelegateDeployment$ } from '../services/universal-receiver.service';

type UniversalProfileObservableOrPromise<
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
export class UniversalProfile {
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
   * @memberof UniversalProfile
   *
   * @example
   * ```javascript
   *lspFactory.UniversalProfile.deploy({
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
  ): UniversalProfileObservableOrPromise<T> {
    const deploymentConfiguration =
      convertUniversalProfileConfigurationObject(contractDeploymentOptions);

    // -1 > Run IPFS upload process in parallel with contract deployment
    const lsp3Profile$ = lsp3ProfileUpload$(
      profileDeploymentOptions.lsp3Profile,
      deploymentConfiguration?.uploadOptions ?? this.options.uploadOptions
    );

    const defaultContractVersion = deploymentConfiguration?.version ?? DEFAULT_CONTRACT_VERSION;

    // 0 > Check for existing base contracts and deploy
    const defaultUPBaseContractAddress =
      deploymentConfiguration?.LSP0ERC725Account?.libAddress ??
      contractVersions[this.options.chainId]?.contracts?.ERC725Account?.versions[
        deploymentConfiguration?.LSP0ERC725Account?.version ?? defaultContractVersion
      ];
    const defaultUniversalReceiverAddress =
      deploymentConfiguration?.LSP1UniversalReceiverDelegate?.libAddress ??
      contractVersions[this.options.chainId]?.contracts?.UniversalReceiverDelegate?.versions[
        deploymentConfiguration?.LSP1UniversalReceiverDelegate?.version ?? defaultContractVersion
      ];
    const defaultKeyManagerBaseContractAddress =
      deploymentConfiguration?.LSP6KeyManager?.libAddress ??
      contractVersions[this.options.chainId]?.contracts?.KeyManager?.versions[
        deploymentConfiguration?.LSP6KeyManager?.version ?? defaultContractVersion
      ];

    const baseContractsToDeploy$ = shouldDeployUniversalProfileBaseContracts$(
      defaultUPBaseContractAddress,
      defaultUniversalReceiverAddress,
      defaultKeyManagerBaseContractAddress,
      this.options.provider,
      this.options.chainId,
      deploymentConfiguration
    );

    const baseContractDeployment$ = universalProfileBaseContractsDeployment$(
      this.signer,
      baseContractsToDeploy$
    );

    const deployUniversalReceiverProxy =
      typeof deploymentConfiguration?.LSP1UniversalReceiverDelegate?.deployProxy === 'undefined'
        ? contractVersions[this.options.chainId]?.contracts?.UniversalReceiverDelegate?.baseContract
        : deploymentConfiguration?.LSP1UniversalReceiverDelegate?.deployProxy;

    const baseContractAddresses$ = universalProfileBaseContractAddresses$(
      baseContractDeployment$,
      defaultUPBaseContractAddress,
      defaultKeyManagerBaseContractAddress,
      deploymentConfiguration,
      deployUniversalReceiverProxy
    );

    // 1 > deploys ERC725Account
    const account$ = accountDeployment$(
      this.signer,
      baseContractAddresses$,
      deploymentConfiguration?.LSP0ERC725Account?.byteCode
    );

    const signerIsUniversalProfile$ = isSignerUniversalProfile$(this.signer);

    // 2 > deploys KeyManager
    const keyManager$ = keyManagerDeployment$(
      this.signer,
      account$,
      baseContractAddresses$,
      signerIsUniversalProfile$,
      deploymentConfiguration?.LSP6KeyManager?.byteCode
    );

    // 3 > deploys UniversalReceiverDelegate
    const universalReceiver$ = universalReceiverDelegateDeployment$(
      this.signer,
      this.options.provider,
      baseContractAddresses$,
      deploymentConfiguration?.LSP1UniversalReceiverDelegate?.libAddress,
      contractVersions[this.options.chainId]?.contracts?.UniversalReceiverDelegate?.versions[
        deploymentConfiguration?.LSP1UniversalReceiverDelegate?.version ?? defaultContractVersion
      ],
      deploymentConfiguration?.LSP1UniversalReceiverDelegate?.byteCode
    );

    // 4 set permissions, profile and universal receiver + transfer ownership to KeyManager
    const setDataAndTransferOwnership$ = setDataAndTransferOwnershipTransactions$(
      this.signer,
      account$,
      universalReceiver$,
      profileDeploymentOptions.controllerAddresses,
      lsp3Profile$,
      signerIsUniversalProfile$,
      keyManager$,
      defaultUniversalReceiverAddress
    );

    const deployment$ = deploymentWithContractsOnCompletion$(
      concat([
        baseContractDeployment$,
        account$,
        merge(universalReceiver$, keyManager$),
        setDataAndTransferOwnership$,
      ]).pipe(concatAll())
    );

    if (deploymentConfiguration?.deployReactive)
      return deployment$ as UniversalProfileObservableOrPromise<T>;

    return lastValueFrom(deployment$) as UniversalProfileObservableOrPromise<T>;
  }

  /**
   * Pre-deploys the latest Version of the UniversalProfile smart-contracts.
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
   * @memberof UniversalProfile
   */
  static async uploadProfileData(
    profileData: ProfileDataBeforeUpload,
    uploadOptions?: UploadOptions
  ): Promise<ProfileDataForEncoding> {
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
      uploadResponse = await ipfsUpload(JSON.stringify(profile), uploadOptions?.ipfsGateway);
    }

    return {
      json: profile,
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
   * @memberof UniversalProfile
   */
  async uploadProfileData(profileData: ProfileDataBeforeUpload, uploadOptions?: UploadOptions) {
    const uploadOptionsToUse = uploadOptions || this.options.uploadOptions || defaultUploadOptions;
    return UniversalProfile.uploadProfileData(profileData, uploadOptionsToUse);
  }
}
