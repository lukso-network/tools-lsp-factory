import { NonceManager } from '@ethersproject/experimental';
import { concat, forkJoin, lastValueFrom, merge, of } from 'rxjs';
import { concatAll, scan } from 'rxjs/operators';

import contractVersions from '../../versions.json';
import { defaultUploadOptions } from '../helpers/config.helper';
import { ipfsUpload, prepareImageForLSP3 } from '../helpers/uploader.helper';
import {
  LSPFactoryOptions,
  ProfileDataBeforeUpload,
  ProfileDeploymentOptions,
} from '../interfaces';
import { LSP3ProfileDataForEncoding } from '../interfaces/lsp3-profile';
import {
  ContractDeploymentOptions,
  DeployedContracts,
  DeploymentEvent,
} from '../interfaces/profile-deployment';
import { ProfileUploadOptions } from '../interfaces/profile-upload-options';
import { baseContractsDeployment$ } from '../services/base-contract.service';
import { keyManagerDeployment$ } from '../services/key-manager.service';

import {
  accountDeployment$,
  getLsp3ProfileDataUrl,
  getTransferOwnershipTransaction$,
  setDataTransaction$,
} from './../services/lsp3-account.service';
import { universalReceiverAddressStoreDeployment$ } from './../services/universal-receiver.service';

/**
 * TODO: docs
 */
export class LSP3UniversalProfile {
  options: LSPFactoryOptions;
  signer: NonceManager;
  constructor(options: LSPFactoryOptions) {
    this.options = options;
    this.signer = new NonceManager(options.signer);
  }

  /**
   * TODO: docs
   */
  deployReactive(
    profileDeploymentOptions: ProfileDeploymentOptions,
    contractDeploymentOptions?: ContractDeploymentOptions
  ) {
    // -1 > Run IPFS upload process in parallel with contract deployment
    const lsp3Profile = profileDeploymentOptions.lsp3Profile
      ? getLsp3ProfileDataUrl(profileDeploymentOptions.lsp3Profile)
      : null;

    // 0 > Check for existing base contracts and deploy
    // TODO: Use base contract bytecode if passed
    let defaultLSP3BaseContractAddress: string;
    let defaultUniversalreceiverBaseContractAddress: string;

    if (contractDeploymentOptions.version) {
      defaultLSP3BaseContractAddress =
        contractVersions[this.options.chainId].baseContracts.LSP3Account[
          contractDeploymentOptions.version
        ];
      defaultUniversalreceiverBaseContractAddress =
        contractVersions[this.options.chainId].baseContracts.UniversalReceiverAddressStore[
          contractDeploymentOptions.version
        ];
    }

    const baseContractByteCode$ = forkJoin([
      this.getDeployedByteCode(
        defaultLSP3BaseContractAddress ?? contractDeploymentOptions.libAddresses.lsp3AccountInit
      ),
      this.getDeployedByteCode(
        defaultUniversalreceiverBaseContractAddress ??
          contractDeploymentOptions.libAddresses.universalReceiverAddressStoreInit
      ),
    ]);

    const baseContracts$ = baseContractsDeployment$(this.signer, baseContractByteCode$);

    const controllerAddresses = profileDeploymentOptions.controllingAccounts.map((controller) => {
      return typeof controller === 'string' ? controller : controller.address;
    });

    // 1 > deploys ERC725Account
    const account$ = accountDeployment$(
      this.signer,
      controllerAddresses,
      contractDeploymentOptions?.libAddresses?.lsp3AccountInit ?? defaultLSP3BaseContractAddress
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
      contractDeploymentOptions?.libAddresses?.universalReceiverAddressStoreInit ??
        defaultUniversalreceiverBaseContractAddress
    );

    // 4 > set permissions, profile and universal
    const setData$ = setDataTransaction$(
      this.signer,
      account$,
      universalReceiver$,
      profileDeploymentOptions.controllingAccounts,
      lsp3Profile
    );

    // 5 > transfersOwnership to KeyManager
    const transferOwnership$ = getTransferOwnershipTransaction$(this.signer, account$, keyManager$);

    return concat([
      baseContracts$,
      account$,
      merge(universalReceiver$, keyManager$),
      setData$,
      transferOwnership$,
    ]).pipe(concatAll());
  }

  /**
   * TODO: docs
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
        console.log(deploymentEvent);
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

  deployBaseContracts() {
    const baseContractByteCode$ = of(['0x', '0x'] as [string, string]);

    const baseContracts$ = baseContractsDeployment$(this.signer, baseContractByteCode$);

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
