import { NonceManager } from '@ethersproject/experimental';
import { concat, forkJoin, lastValueFrom, merge, of } from 'rxjs';
import { concatAll, scan } from 'rxjs/operators';

import contractVersions from '../../versions.json';
import { DEFAULT_CONTRACT_VERSION } from '../helpers/config.helper';
import { defaultUploadOptions } from '../helpers/config.helper';
import { ipfsUpload, prepareImageForLSP3 } from '../helpers/uploader.helper';
import {
  DeploymentEvent,
  LSPFactoryOptions,
  ProfileDataBeforeUpload,
  ProfileDeploymentOptions,
} from '../interfaces';
import { LSP3ProfileDataForEncoding } from '../interfaces/lsp3-profile';
import { ContractDeploymentOptions, DeployedContracts } from '../interfaces/profile-deployment';
import { ProfileUploadOptions } from '../interfaces/profile-upload-options';
import {
  getUniversalProfileBaseContractAddresses$,
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
   * Returns an Observable which emits events as UP contracts are deployed
   *
   * @param {ProfileDeploymentOptions} profileData
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @return {*}  Observable<LSP3AccountDeploymentEvent | DeploymentEventTransaction>
   * @memberof LSP3UniversalProfile
   */
  deployReactive(
    profileDeploymentOptions: ProfileDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    // -1 > Run IPFS upload process in parallel with contract deployment
    const lsp3Profile$ = lsp3ProfileUpload$(profileDeploymentOptions.lsp3Profile);

    // 0 > Check for existing base contracts and deploy
    const defaultUPBaseContractAddress =
      contractVersions[this.options.chainId]?.baseContracts?.ERC725Account[
        DEFAULT_CONTRACT_VERSION
      ];
    const defaultUniversalReceiverBaseContractAddress =
      contractVersions[this.options.chainId]?.baseContracts?.UniversalReceiverDelegate[
        DEFAULT_CONTRACT_VERSION
      ];
    const defaultKeyManagerBaseContractAddress =
      contractVersions[this.options.chainId]?.baseContracts?.KeyManager[DEFAULT_CONTRACT_VERSION];

    const defaultBaseContractByteCode$ = forkJoin([
      this.getDeployedByteCode(
        defaultUPBaseContractAddress ?? '0x0000000000000000000000000000000000000000'
      ),
      this.getDeployedByteCode(
        defaultUniversalReceiverBaseContractAddress ?? '0x0000000000000000000000000000000000000000'
      ),
      this.getDeployedByteCode(
        defaultKeyManagerBaseContractAddress ?? '0x0000000000000000000000000000000000000000'
      ),
    ]);

    const baseContractAddresses$ = getUniversalProfileBaseContractAddresses$(
      defaultUPBaseContractAddress,
      defaultUniversalReceiverBaseContractAddress,
      defaultKeyManagerBaseContractAddress,
      defaultBaseContractByteCode$,
      this.signer,
      contractDeploymentOptions
    );

    const controllerAddresses = profileDeploymentOptions.controllingAccounts.map((controller) => {
      return typeof controller === 'string' ? controller : controller.address;
    });

    // 1 > deploys ERC725Account
    const account$ = accountDeployment$(this.signer, controllerAddresses, baseContractAddresses$);

    // 2 > deploys KeyManager
    const keyManager$ = keyManagerDeployment$(this.signer, account$, baseContractAddresses$);

    // 3 > deploys UniversalReceiverDelegate
    const universalReceiver$ = universalReceiverDelegateDeployment$(
      this.signer,
      baseContractAddresses$
    );

    // 4 > set permissions, profile and universal
    const setData$ = setDataTransaction$(
      this.signer,
      account$,
      universalReceiver$,
      profileDeploymentOptions.controllingAccounts,
      lsp3Profile$
    );

    // 5 > transfersOwnership to KeyManager
    const transferOwnership$ = getTransferOwnershipTransaction$(this.signer, account$, keyManager$);

    return concat([
      account$,
      merge(universalReceiver$, keyManager$),
      setData$,
      transferOwnership$,
    ]).pipe(concatAll());
  }

  /**
   * Deploys a UniversalProfile to the blockchain and uploads LSP3 Profile data to IPFS
   *
   * Asyncronous version of `deployReactive`. Returns a Promise with deployed contract details
   *
   * @param {ProfileDeploymentOptions} profileData
   * @param {ContractDeploymentOptions} contractDeploymentOptions
   * @returns {*}  Promise<DeployedContracts>
   * @memberof LSP3UniversalProfile
   *
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
  deploy(
    profileDeploymentOptions: ProfileDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    const deployments$ = this.deployReactive(
      profileDeploymentOptions,
      contractDeploymentOptions
    ).pipe(
      scan((accumulator: DeployedContracts, deploymentEvent: DeploymentEvent) => {
        if (deploymentEvent.receipt && deploymentEvent.receipt.contractAddress) {
          accumulator[deploymentEvent.contractName] = {
            address: deploymentEvent.receipt.contractAddress,
            receipt: deploymentEvent.receipt,
          };
        }

        return accumulator;
      }, {})
    );

    return lastValueFrom(deployments$);
  }

  getDeployedByteCode(contractAddress: string) {
    return this.options.provider.getCode(contractAddress);
  }

  /**
   * Deploys UniversalProfile base contracts
   *
   * Returns Promise with base contract details
   *
   * @returns {*}  Promise<DeployedContracts>
   * @memberof LSP3UniversalProfile
   */
  deployBaseContracts() {
    const baseContractsToDeploy$ = of([true, true, true] as [boolean, boolean, boolean]);

    const baseContracts$ = universalProfileBaseContractsDeployment$(
      this.signer,
      baseContractsToDeploy$
    );

    const deployments$ = baseContracts$.pipe(
      scan((accumulator: DeployedContracts, deploymentEvent: DeploymentEvent) => {
        if (deploymentEvent.receipt && deploymentEvent.receipt.contractAddress) {
          accumulator[deploymentEvent.contractName] = {
            address: deploymentEvent.receipt.contractAddress,
            receipt: deploymentEvent.receipt,
          };
        }

        return accumulator;
      }, {})
    );

    return lastValueFrom(deployments$);
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
  ): Promise<LSP3ProfileDataForEncoding> {
    uploadOptions = uploadOptions || defaultUploadOptions;

    const [profileImage, backgroundImage] = await Promise.all([
      prepareImageForLSP3(uploadOptions, profileData.profileImage),
      prepareImageForLSP3(uploadOptions, profileData.backgroundImage),
    ]);

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
