import { Signer } from '@ethersproject/abstract-signer';
import axios from 'axios';
import { ContractFactory } from 'ethers';
import { concat, EMPTY, from, Observable, of, shareReplay, switchMap, takeLast } from 'rxjs';

import {
  LSP7DigitalAsset__factory,
  LSP7Mintable__factory,
  LSP7MintableInit__factory,
  LSP8IdentifiableDigitalAsset__factory,
  LSP8Mintable__factory,
  LSP8MintableInit__factory,
} from '../../';
import { LSP4DigitalAssetMetadata } from '../classes/lsp4-digital-asset-metadata';
import { GAS_BUFFER, GAS_PRICE } from '../helpers/config.helper';
import { deployContract, deployProxyContract, waitForReceipt } from '../helpers/deployment.helper';
import { isMetadataEncoded } from '../helpers/uploader.helper';
import { DeploymentEventContract, DeploymentEventProxyContract } from '../interfaces';
import {
  ContractNames,
  DigitalAssetDeploymentOptions,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';
import {
  LSP4DigitalAssetJSON,
  LSP4MetadataBeforeUpload,
  LSP4MetadataForEncoding,
} from '../interfaces/lsp4-digital-asset';
import { UploadOptions } from '../interfaces/profile-upload-options';

export type DigitalAssetDeploymentEvent = DeploymentEventContract | DeploymentEventProxyContract;

// LSP7

export function lsp7DigitalAssetDeployment$(
  signer: Signer,
  digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
  baseContractAddress$: Observable<string>,
  byteCode?: string
) {
  return baseContractAddress$.pipe(
    switchMap((baseContractAddress) => {
      return lsp7DigitalAssetDeploymentWithBaseContractAddress$(
        signer,
        digitalAssetDeploymentOptions,
        baseContractAddress,
        byteCode
      );
    }),
    shareReplay()
  );
}

export function lsp7DigitalAssetDeploymentWithBaseContractAddress$(
  signer: Signer,
  digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
  baseContractAddress?: string,
  byteCode?: string
) {
  const lsp7Deployment$ = from(
    deployLSP7DigitalAsset(signer, digitalAssetDeploymentOptions, baseContractAddress, byteCode)
  ).pipe(shareReplay());

  const lsp7DeploymentReceipt$ = waitForReceipt<DigitalAssetDeploymentEvent>(lsp7Deployment$).pipe(
    shareReplay()
  );

  const lsp7Initialize$ = baseContractAddress
    ? initializeLSP7Proxy(
        signer,
        lsp7DeploymentReceipt$ as Observable<DeploymentEventProxyContract>,
        digitalAssetDeploymentOptions
      )
    : EMPTY;

  const lsp7InitializeReceipt$ = waitForReceipt<DigitalAssetDeploymentEvent>(lsp7Initialize$).pipe(
    shareReplay()
  );

  return concat(lsp7Deployment$, lsp7DeploymentReceipt$, lsp7Initialize$, lsp7InitializeReceipt$);
}

async function deployLSP7DigitalAsset(
  signer: Signer,
  digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
  baseContractAddress?: string,
  byteCode?: string
) {
  const deploymentFunction = async () => {
    if (baseContractAddress) {
      return new LSP7MintableInit__factory(signer).attach(baseContractAddress);
    }

    if (byteCode) {
      return new ContractFactory(LSP7DigitalAsset__factory.abi, byteCode, signer).deploy(
        digitalAssetDeploymentOptions.name,
        digitalAssetDeploymentOptions.symbol,
        digitalAssetDeploymentOptions.controllerAddress,
        digitalAssetDeploymentOptions.isNFT
      );
    }

    return await new LSP7Mintable__factory(signer).deploy(
      digitalAssetDeploymentOptions.name,
      digitalAssetDeploymentOptions.symbol,
      digitalAssetDeploymentOptions.controllerAddress,
      digitalAssetDeploymentOptions.isNFT
    );
  };

  return baseContractAddress
    ? deployProxyContract(
        LSP7MintableInit__factory.abi,
        deploymentFunction,
        ContractNames.LSP7_DIGITAL_ASSET,
        signer
      )
    : deployContract(deploymentFunction, ContractNames.LSP7_DIGITAL_ASSET);
}

function initializeLSP7Proxy(
  signer: Signer,
  digitalAssetDeploymentReceipt$: Observable<DeploymentEventProxyContract>,
  digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions
) {
  const { name, symbol, controllerAddress, isNFT } = digitalAssetDeploymentOptions;

  const initialize$ = digitalAssetDeploymentReceipt$.pipe(
    takeLast(1),
    switchMap(async (result) => {
      const contract = await new LSP7MintableInit__factory(signer).attach(
        result.receipt.contractAddress
      );

      const gasEstimate = await contract.estimateGas[`initialize(string,string,address,bool)`](
        name,
        symbol,
        controllerAddress,
        isNFT,
        {
          gasPrice: GAS_PRICE,
        }
      );

      const transaction = await contract[`initialize(string,string,address,bool)`](
        name,
        symbol,
        controllerAddress,
        isNFT,
        {
          gasLimit: gasEstimate.add(GAS_BUFFER),
          gasPrice: GAS_PRICE,
        }
      );

      return {
        type: result.type,
        contractName: result.contractName,
        functionName: 'initialize',
        status: result.status,
        transaction,
      };
    }),
    shareReplay()
  );

  return initialize$ as unknown as Observable<DeploymentEventProxyContract>;
}

// LSP8

export function lsp8IdentifiableDigitalAssetDeployment$(
  signer: Signer,
  digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
  baseContractAddress$: Observable<string>,
  byteCode?: string
) {
  return baseContractAddress$.pipe(
    switchMap((baseContractAddress) => {
      return lsp8IdentifiableDigitalAssetDeploymentWithBaseContractAddress$(
        signer,
        digitalAssetDeploymentOptions,
        baseContractAddress,
        byteCode
      );
    }),
    shareReplay()
  );
}

export function lsp8IdentifiableDigitalAssetDeploymentWithBaseContractAddress$(
  signer: Signer,
  digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
  baseContractAddress: string,
  byteCode?: string
) {
  const lsp8Deployment$ = from(
    deployLSP8IdentifiableDigitalAsset(
      signer,
      digitalAssetDeploymentOptions,
      baseContractAddress,
      byteCode
    )
  ).pipe(shareReplay());

  const lsp8DeploymentReceipt$ = waitForReceipt<DigitalAssetDeploymentEvent>(lsp8Deployment$);

  const lsp8Initialize$ = baseContractAddress
    ? initializeLSP8Proxy(
        signer,
        lsp8DeploymentReceipt$ as Observable<DeploymentEventProxyContract>,
        digitalAssetDeploymentOptions
      )
    : EMPTY;

  const lsp8InitializeReceipt$ = waitForReceipt<DigitalAssetDeploymentEvent>(lsp8Initialize$).pipe(
    shareReplay()
  );

  return concat(lsp8Deployment$, lsp8DeploymentReceipt$, lsp8Initialize$, lsp8InitializeReceipt$);
}

async function deployLSP8IdentifiableDigitalAsset(
  signer: Signer,
  digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
  baseContractAddress: string,
  byteCode?: string
) {
  const deploymentFunction = async () => {
    if (baseContractAddress) {
      return new LSP8MintableInit__factory(signer).attach(baseContractAddress);
    }

    if (byteCode) {
      return new ContractFactory(
        LSP8IdentifiableDigitalAsset__factory.abi,
        byteCode,
        signer
      ).deploy(
        digitalAssetDeploymentOptions.name,
        digitalAssetDeploymentOptions.symbol,
        digitalAssetDeploymentOptions.controllerAddress
      );
    }

    return new LSP8Mintable__factory(signer).deploy(
      digitalAssetDeploymentOptions.name,
      digitalAssetDeploymentOptions.symbol,
      digitalAssetDeploymentOptions.controllerAddress
    );
  };

  return baseContractAddress
    ? deployProxyContract(
        LSP8MintableInit__factory.abi,
        deploymentFunction,
        ContractNames.LSP8_DIGITAL_ASSET,
        signer
      )
    : deployContract(deploymentFunction, ContractNames.LSP8_DIGITAL_ASSET);
}

function initializeLSP8Proxy(
  signer: Signer,
  digitalAssetDeploymentReceipt$: Observable<DeploymentEventProxyContract>,
  digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions
) {
  const { name, symbol, controllerAddress } = digitalAssetDeploymentOptions;

  const initialize$ = digitalAssetDeploymentReceipt$.pipe(
    takeLast(1),
    switchMap(async (result) => {
      const contract = await new LSP8MintableInit__factory(signer).attach(
        result.receipt.contractAddress
      );

      const gasEstimate = await contract.estimateGas[`initialize(string,string,address)`](
        name,
        symbol,
        controllerAddress,
        {
          gasPrice: GAS_PRICE,
        }
      );

      const transaction = await contract[`initialize(string,string,address)`](
        name,
        symbol,
        controllerAddress,
        {
          gasLimit: gasEstimate.add(GAS_BUFFER),
          gasPrice: GAS_PRICE,
        }
      );
      return {
        type: result.type,
        contractName: result.contractName,
        functionName: 'initialize',
        status: result.status,
        transaction,
      };
    }),
    shareReplay()
  );

  return initialize$ as Observable<DeploymentEventProxyContract>;
}

export function lsp4MetadataUpload$(
  lsp4Metadata: LSP4MetadataBeforeUpload | string,
  uploadOptions?: UploadOptions
) {
  let lsp4Metadata$: Observable<LSP4MetadataForEncoding | string>;

  if (typeof lsp4Metadata !== 'string' || isMetadataEncoded(lsp4Metadata)) {
    lsp4Metadata$ = lsp4Metadata ? from(getLSP4MetadataUrl(lsp4Metadata, uploadOptions)) : of(null);
  } else {
    lsp4Metadata$ = of(lsp4Metadata);
  }

  return lsp4Metadata$;
}

export async function getLSP4MetadataUrl(
  lsp4Metadata: LSP4MetadataBeforeUpload | string,
  uploadOptions: UploadOptions
): Promise<LSP4MetadataForEncoding> {
  let lsp4MetadataForEncoding: LSP4MetadataForEncoding;

  if (typeof lsp4Metadata === 'string') {
    let lsp4JsonUrl = lsp4Metadata;
    const isIPFSUrl = lsp4Metadata.startsWith('ipfs://');

    if (isIPFSUrl) {
      // TODO: Handle simple HTTP upload
      const protocol = uploadOptions.ipfsClientOptions.host ?? 'https';
      const host = uploadOptions.ipfsClientOptions.host ?? 'ipfs.lukso.network';

      lsp4JsonUrl = `${[protocol]}://${host}/ipfs/${lsp4Metadata.split('/').at(-1)}`;
    }

    const ipfsResponse = await axios.get(lsp4JsonUrl);
    const lsp4MetadataJSON = ipfsResponse.data;

    lsp4MetadataForEncoding = {
      url: lsp4Metadata,
      lsp4Metadata: lsp4MetadataJSON as LSP4DigitalAssetJSON,
    };
  } else {
    lsp4MetadataForEncoding = await LSP4DigitalAssetMetadata.uploadMetadata(
      lsp4Metadata,
      uploadOptions
    );
  }

  return lsp4MetadataForEncoding;
}
