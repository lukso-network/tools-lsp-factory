import { Signer } from '@ethersproject/abstract-signer';
import { concat, EMPTY, from, Observable, shareReplay, switchMap, takeLast } from 'rxjs';

import {
  LSP7DigitalAsset__factory,
  LSP7DigitalAssetInit__factory,
  LSP8IdentifiableDigitalAsset__factory,
  LSP8IdentifiableDigitalAssetInit__factory,
} from '../../';
import { deployContract, deployProxyContract, waitForReceipt } from '../helpers/deployment.helper';
import { DeploymentEventContract, DeploymentEventProxyContract } from '../interfaces';
import {
  ContractNames,
  DigitalAssetDeploymentOptions,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';

export type DigitalAssetDeploymentEvent = DeploymentEventContract | DeploymentEventProxyContract;

// LSP7

export function lsp7DigitalAssetDeployment$(
  signer: Signer,
  digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions,
  baseContractAddress?: string
) {
  const lsp7Deployment$ = from(
    deployLSP7DigitalAsset(signer, digitalAssetDeploymentOptions, baseContractAddress)
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
  baseContractAddress?: string
) {
  const deploymentFunction = async () => {
    return baseContractAddress
      ? new LSP7DigitalAssetInit__factory(signer).attach(baseContractAddress)
      : await new LSP7DigitalAsset__factory(signer).deploy(
          digitalAssetDeploymentOptions.name,
          digitalAssetDeploymentOptions.symbol,
          digitalAssetDeploymentOptions.ownerAddress,
          digitalAssetDeploymentOptions.isNFT
        );
  };

  return baseContractAddress
    ? deployProxyContract(
        LSP7DigitalAssetInit__factory.abi,
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
  const { name, symbol, ownerAddress, isNFT } = digitalAssetDeploymentOptions;

  const initialize$ = digitalAssetDeploymentReceipt$.pipe(
    takeLast(1),
    switchMap(async (result) => {
      const contract = await new LSP7DigitalAssetInit__factory(signer).attach(
        result.receipt.contractAddress
      );
      const transaction = await contract[`initialize(string,string,address,bool)`](
        name,
        symbol,
        ownerAddress,
        isNFT,
        {
          gasLimit: 3_000_000,
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
  baseContractAddress: string
) {
  const lsp8Deployment$ = from(
    deployLSP8IdentifiableDigitalAsset(signer, digitalAssetDeploymentOptions, baseContractAddress)
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
  baseContractAddress: string
) {
  const deploymentFunction = async () => {
    return baseContractAddress
      ? new LSP8IdentifiableDigitalAssetInit__factory(signer).attach(baseContractAddress)
      : await new LSP8IdentifiableDigitalAsset__factory(signer).deploy(
          digitalAssetDeploymentOptions.name,
          digitalAssetDeploymentOptions.symbol,
          digitalAssetDeploymentOptions.ownerAddress
        );
  };

  return baseContractAddress
    ? deployProxyContract(
        LSP8IdentifiableDigitalAssetInit__factory.abi,
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
  const { name, symbol, ownerAddress } = digitalAssetDeploymentOptions;

  const initialize$ = digitalAssetDeploymentReceipt$.pipe(
    takeLast(1),
    switchMap(async (result) => {
      const contract = await new LSP7DigitalAssetInit__factory(signer).attach(
        result.receipt.contractAddress
      );
      const transaction = await contract[`initialize(string,string,address)`](
        name,
        symbol,
        ownerAddress,
        {
          gasLimit: 3_000_000,
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
