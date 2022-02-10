import { Signer } from '@ethersproject/abstract-signer';
import { concat, EMPTY, from, Observable, shareReplay, switchMap, takeLast } from 'rxjs';

import {
  LSP7Mintable__factory,
  LSP7MintableInit__factory,
  LSP8Mintable__factory,
  LSP8MintableInit__factory,
} from '../../';
import { GAS_BUFFER, GAS_PRICE } from '../helpers/config.helper';
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
      ? new LSP7MintableInit__factory(signer).attach(baseContractAddress)
      : await new LSP7Mintable__factory(signer).deploy(
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
      ? new LSP8MintableInit__factory(signer).attach(baseContractAddress)
      : await new LSP8Mintable__factory(signer).deploy(
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
