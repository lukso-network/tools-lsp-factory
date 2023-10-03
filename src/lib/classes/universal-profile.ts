import { NonceManager } from '@ethersproject/experimental';
import { concat, merge } from 'rxjs';
import { concatAll, shareReplay } from 'rxjs/operators';

import contractVersions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import { resolveContractDeployment, waitForContractDeployment } from '../helpers/deployment.helper';
import { prepareMetadataAsset, prepareMetadataImage } from '../helpers/uploader.helper';
import {
  LSPFactoryOptions,
  ProfileDataBeforeUpload,
  ProfileDeploymentOptions,
} from '../interfaces';
import { LSP3ProfileBeforeUpload, ProfileDataForEncoding } from '../interfaces/lsp3-profile';
import {
  ContractDeploymentOptions,
  DeployedUniversalProfileContracts,
} from '../interfaces/profile-deployment';
import { assertUploadProvider, UploadProvider } from '../interfaces/profile-upload-options';
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
} from '../services/universal-profile.service';
import { universalReceiverDelegateDeployment$ } from '../services/universal-receiver.service';

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
   * Returns a Promise with deployed contract details.
   *
   * @param {ProfileDeploymentOptions} profileData
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Promise<DeployedContracts>
   * @memberof UniversalProfile
   *
   * @example
   * ```javascript
   *lspFactory.UniversalProfile.deploy({
   *    controllerAddresses: ['0xb74a88C43BCf691bd7A851f6603cb1868f6fc147'],
   *    lsp3Profile: myUniversalProfileData
   *  });
   *};
   * ```
   */
  async deploy(
    profileDeploymentOptions: ProfileDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ): Promise<DeployedUniversalProfileContracts> {
    await this.options.finishInit;
    const deploymentConfiguration =
      convertUniversalProfileConfigurationObject(contractDeploymentOptions);

    // -1 > Run IPFS upload process in parallel with contract deployment
    const lsp3Profile$ = lsp3ProfileUpload$(
      profileDeploymentOptions?.lsp3Profile,
      deploymentConfiguration?.uploadProvider ?? this.options.uploadProvider
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

    // 4 > set permissions, lsp3metadata and universal receiver + transfer ownership to KeyManager
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

    const deployment$ = concat([
      baseContractDeployment$,
      account$,
      merge(universalReceiver$, keyManager$),
      setDataAndTransferOwnership$,
    ]).pipe(concatAll(), shareReplay());

    if (
      contractDeploymentOptions?.onDeployEvents?.next ||
      contractDeploymentOptions?.onDeployEvents?.error
    ) {
      deployment$.subscribe({
        next: contractDeploymentOptions?.onDeployEvents?.next,
        error: contractDeploymentOptions?.onDeployEvents?.error || (() => null),
      });
    }

    const contractsPromise =
      waitForContractDeployment<DeployedUniversalProfileContracts>(deployment$);

    return resolveContractDeployment(contractsPromise, contractDeploymentOptions?.onDeployEvents);
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
    profileData: ProfileDataBeforeUpload | LSP3ProfileBeforeUpload,
    uploadProvider?: UploadProvider
  ): Promise<ProfileDataForEncoding> {
    uploadProvider = assertUploadProvider(uploadProvider);

    profileData = 'LSP3Profile' in profileData ? profileData.LSP3Profile : profileData;

    const [profileImage, backgroundImage, avatar] = await Promise.all([
      prepareMetadataImage(uploadProvider, profileData.profileImage),
      prepareMetadataImage(uploadProvider, profileData.backgroundImage),
      profileData.avatar
        ? Promise.all(
            profileData.avatar?.map((avatar) => prepareMetadataAsset(avatar, uploadProvider))
          )
        : undefined,
    ]);

    const profile = {
      LSP3Profile: {
        ...profileData,
        profileImage,
        backgroundImage,
        avatar,
      },
    };

    const url = await uploadProvider(Buffer.from(JSON.stringify(profile)));

    return {
      json: profile,
      url: url.toString(),
    };
  }

  /**
   * Uploads the LSP3Profile to the desired endpoint. This can be an `https` URL either pointing to
   * a public, centralized storage endpoint or an IPFS Node / Cluster.
   *
   * Will upload and process passed images.
   *
   * Uses UploadProvider specified when instantiating LSPFactory instance.
   *
   * @param {ProfileDataBeforeUpload} profileData
   * @return {*}  {(Promise<AddResult | string>)} Returns processed LSP3 Data and upload url
   * @memberof UniversalProfile
   */
  async uploadProfileData(profileData: ProfileDataBeforeUpload, uploadProvider: UploadProvider) {
    if (!uploadProvider) {
      throw new Error(`Upload provider is required`);
    }
    return UniversalProfile.uploadProfileData(profileData, uploadProvider);
  }
}
