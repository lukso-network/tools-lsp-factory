import { Signer } from '@ethersproject/abstract-signer';
import axios from 'axios';
import { ContractFactory, ethers } from 'ethers';
import {
  concat,
  EMPTY,
  forkJoin,
  from,
  Observable,
  of,
  shareReplay,
  switchMap,
  takeLast,
} from 'rxjs';

import {
  LSP7DigitalAsset__factory,
  LSP7Mintable__factory,
  LSP7MintableInit__factory,
  LSP8IdentifiableDigitalAsset__factory,
  LSP8Mintable__factory,
  LSP8MintableInit__factory,
} from '../../';
import { LSP4DigitalAssetMetadata } from '../classes/lsp4-digital-asset-metadata';
import {
  ERC725_ACCOUNT_INTERRFACE,
  GAS_BUFFER,
  GAS_PRICE,
  LSP4_KEYS,
} from '../helpers/config.helper';
import { deployContract, deployProxyContract, waitForReceipt } from '../helpers/deployment.helper';
import { encodeLSP4Metadata } from '../helpers/erc725.helper';
import { isMetadataEncoded } from '../helpers/uploader.helper';
import {
  DeploymentEvent$,
  DeploymentEventContract,
  DeploymentEventProxyContract,
  DeploymentEventTransaction,
  DeploymentStatus,
  DeploymentType,
} from '../interfaces';
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
  const controllerAddress = await signer.getAddress();

  const deploymentFunction = async () => {
    if (baseContractAddress) {
      return new LSP7MintableInit__factory(signer).attach(baseContractAddress);
    }

    if (byteCode) {
      return new ContractFactory(LSP7DigitalAsset__factory.abi, byteCode, signer).deploy(
        digitalAssetDeploymentOptions.name,
        digitalAssetDeploymentOptions.symbol,
        controllerAddress,
        digitalAssetDeploymentOptions.isNFT
      );
    }

    return await new LSP7Mintable__factory(signer).deploy(
      digitalAssetDeploymentOptions.name,
      digitalAssetDeploymentOptions.symbol,
      controllerAddress,
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
  const { name, symbol, isNFT } = digitalAssetDeploymentOptions;

  const initialize$ = digitalAssetDeploymentReceipt$.pipe(
    takeLast(1),
    switchMap(async (result) => {
      const contract = await new LSP7MintableInit__factory(signer).attach(
        result.receipt.contractAddress
      );

      const controllerAddress = await signer.getAddress();

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
  const controllerAddress = await signer.getAddress();

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
        controllerAddress
      );
    }

    return new LSP8Mintable__factory(signer).deploy(
      digitalAssetDeploymentOptions.name,
      digitalAssetDeploymentOptions.symbol,
      controllerAddress
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
  const { name, symbol } = digitalAssetDeploymentOptions;

  const initialize$ = digitalAssetDeploymentReceipt$.pipe(
    takeLast(1),
    switchMap(async (result) => {
      const contract = await new LSP8MintableInit__factory(signer).attach(
        result.receipt.contractAddress
      );

      const controllerAddress = await signer.getAddress();

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
  let lsp4Metadata$: Observable<string>;

  if (typeof lsp4Metadata !== 'string' || !isMetadataEncoded(lsp4Metadata)) {
    lsp4Metadata$ = lsp4Metadata
      ? from(getEncodedLSP4Metadata(lsp4Metadata, uploadOptions)).pipe(shareReplay())
      : of(null);
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

export async function getEncodedLSP4Metadata(
  lsp4Metadata: LSP4MetadataBeforeUpload | string,
  uploadOptions: UploadOptions
): Promise<string> {
  const lsp4MetadataForEncoding = await getLSP4MetadataUrl(lsp4Metadata, uploadOptions);

  const encodedLSP4Metadata = encodeLSP4Metadata(
    lsp4MetadataForEncoding.lsp4Metadata,
    lsp4MetadataForEncoding.url
  );

  return encodedLSP4Metadata.LSP4Metadata.value;
}

export function setMetadataAndTransferOwnership$(
  signer: Signer,
  digitalAsset$: Observable<DigitalAssetDeploymentEvent>,
  lsp4Metadata$: Observable<string | null>,
  digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
  contractName: string,
  isSignerUniversalProfile$: Observable<boolean>
) {
  return concat(
    setLSP4Metadata$(
      signer,
      digitalAsset$,
      lsp4Metadata$,
      contractName,
      digitalAssetDeploymentOptions,
      isSignerUniversalProfile$
    ),
    transferOwnership$(
      signer,
      digitalAsset$,
      digitalAssetDeploymentOptions,
      contractName,
      isSignerUniversalProfile$
    )
  );
}

export function setLSP4Metadata$(
  signer: Signer,
  digitalAsset$: Observable<DigitalAssetDeploymentEvent>,
  lsp4Metadata$: Observable<string | null>,
  contractName: string,
  digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
  isSignerUniversalProfile$: Observable<boolean>
): Observable<DeploymentEventTransaction> {
  const setDataTransaction$ = forkJoin([
    digitalAsset$,
    lsp4Metadata$,
    isSignerUniversalProfile$,
  ]).pipe(
    switchMap(([{ receipt: digitalAssetReceipt }, lsp4Metadata, isSignerUniversalProfile]) => {
      const digitalAssetAddress = isSignerUniversalProfile
        ? digitalAssetReceipt.contractAddress || digitalAssetReceipt.logs[0].address
        : digitalAssetReceipt.contractAddress || digitalAssetReceipt.to;

      return setData(
        signer,
        digitalAssetAddress,
        lsp4Metadata,
        digitalAssetDeploymentOptions,
        contractName
      );
    }),
    shareReplay()
  );

  const setDataReceipt$ = waitForReceipt<DeploymentEventTransaction>(setDataTransaction$);
  return concat(setDataTransaction$, setDataReceipt$);
}

async function setData(
  signer: Signer,
  digitalAssetAddress: string,
  lsp4Metadata: string,
  digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
  contractName: string
): Promise<DeploymentEventTransaction> {
  const digitalAsset = new LSP7Mintable__factory(signer).attach(digitalAssetAddress);

  const creators = digitalAssetDeploymentOptions?.creators ?? [];

  const creatorArrayIndexKeys: string[] = [];
  const creatorArrayIndexValues: string[] = [];

  const creatorsMapKeys: string[] = [];
  const creatorsMapValues: string[] = [];

  creators.forEach((creatorAddress, index) => {
    creatorArrayIndexKeys.push(
      LSP4_KEYS.LSP4_CREATORS_ARRAY.slice(0, 34) +
        ethers.utils.hexZeroPad(ethers.utils.hexlify([index]), 16).substring(2)
    );

    creatorArrayIndexValues.push(creatorAddress);

    creatorsMapKeys.push(LSP4_KEYS.LSP4_CREATORS_MAP_PREFIX + creatorAddress.slice(2));

    creatorsMapValues.push(
      ethers.utils.hexZeroPad(ethers.utils.hexlify([index]), 8) + ERC725_ACCOUNT_INTERRFACE.slice(2)
    );
  });

  const keysToSet = [LSP4_KEYS.LSP4_CREATORS_ARRAY, ...creatorArrayIndexKeys, ...creatorsMapKeys];
  const valuesToSet = [
    ethers.utils.hexZeroPad(ethers.utils.hexlify([creators.length]), 32),
    ...creatorArrayIndexValues,
    ...creatorsMapValues,
  ];

  if (lsp4Metadata) {
    keysToSet.push(LSP4_KEYS.LSP4_METADATA);
    valuesToSet.push(lsp4Metadata);
  }

  const gasEstimate = await digitalAsset.estimateGas.setData(keysToSet, valuesToSet, {
    gasPrice: GAS_PRICE,
  });

  const transaction = await digitalAsset.setData(keysToSet, valuesToSet, {
    gasLimit: gasEstimate.add(GAS_BUFFER),
    gasPrice: GAS_PRICE,
  });

  return {
    type: DeploymentType.TRANSACTION,
    contractName,
    functionName: 'setData',
    status: DeploymentStatus.PENDING,
    transaction,
  };
}

export function transferOwnership$(
  signer: Signer,
  digitalAsset$: DeploymentEvent$,
  digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions,
  contractName: string,
  isSignerUniversalProfile$: Observable<boolean>
) {
  const transferOwnershipTransaction$ = forkJoin([digitalAsset$, isSignerUniversalProfile$]).pipe(
    switchMap(([{ receipt: digitalAssetDeploymentReceipt }, isSignerUniversalProfile]) => {
      const digitalAssetAddress = isSignerUniversalProfile
        ? digitalAssetDeploymentReceipt.contractAddress ||
          digitalAssetDeploymentReceipt.logs[0].address
        : digitalAssetDeploymentReceipt.contractAddress || digitalAssetDeploymentReceipt.to;

      return transferOwnership(
        signer,
        digitalAssetAddress,
        digitalAssetDeploymentOptions.controllerAddress,
        contractName
      );
    }),
    shareReplay()
  );

  const transferOwnershipReceipt$ = waitForReceipt<DeploymentEventTransaction>(
    transferOwnershipTransaction$
  );

  return concat(transferOwnershipTransaction$, transferOwnershipReceipt$);
}

async function transferOwnership(
  signer: Signer,
  digitalAssetAddress: string,
  controllerAddress: string,
  contractName: string
): Promise<DeploymentEventTransaction> {
  try {
    const signerAddress = await signer.getAddress();
    const digitalAsset = new LSP7Mintable__factory(signer).attach(digitalAssetAddress);

    const gasEstimate = await digitalAsset.estimateGas.transferOwnership(controllerAddress, {
      from: signerAddress,
      gasPrice: GAS_PRICE,
    });

    const transaction = await digitalAsset.transferOwnership(controllerAddress, {
      from: signerAddress,
      gasPrice: GAS_PRICE,
      gasLimit: gasEstimate.add(GAS_BUFFER),
    });

    return {
      type: DeploymentType.TRANSACTION,
      status: DeploymentStatus.PENDING,
      contractName,
      functionName: 'transferOwnership',
      transaction,
    };
  } catch (error) {
    console.error('Error when transferring ownership');
    throw error;
  }
}
