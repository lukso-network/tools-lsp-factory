import { Signer } from '@ethersproject/abstract-signer';
import { concat, defer, EMPTY, from, Observable, shareReplay, switchMap, takeLast } from 'rxjs';

import { LSP7Init__factory } from '../../tmp/Factories/LSP7Init__factory';
import { LSP7__factory } from '../../tmp/Factories/LSP7__factory';
import { LSP8__factory } from '../../tmp/Factories/LSP8__factory';
import { deployContract, deployProxyContract, waitForReceipt } from '../helpers/deployment.helper';
import { DeploymentEventContract, DeploymentEventProxyContract } from '../interfaces';
import {
  ContractNames,
  DigitalAssetDeploymentOptions,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';

export type DigitalAssetDeploymentEvent = DeploymentEventContract | DeploymentEventProxyContract;

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
      ? new LSP7Init__factory(signer).attach(baseContractAddress)
      : await new LSP7__factory(signer).deploy(
          digitalAssetDeploymentOptions.name,
          digitalAssetDeploymentOptions.symbol,
          digitalAssetDeploymentOptions.ownerAddress,
          digitalAssetDeploymentOptions.isNFT
        );
  };

  return baseContractAddress
    ? deployProxyContract(
        LSP7Init__factory.abi,
        deploymentFunction,
        ContractNames.LSP7_DIGITAL_ASSET,
        signer
      )
    : deployContract(deploymentFunction, ContractNames.LSP7_DIGITAL_ASSET);
}

export function lsp8IdentifiableDigitalAssetDeployment$(
  signer: Signer,
  digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions
) {
  // TODO: implemet Proxy deployment

  const digitalAssetDeployment$ = defer(() =>
    deployLSP8IdentifiableDigitalAsset(signer, digitalAssetDeploymentOptions)
  );

  const digitalAssetDeploymentReceipt$ =
    waitForReceipt<DigitalAssetDeploymentEvent>(digitalAssetDeployment$);

  return concat(digitalAssetDeployment$, digitalAssetDeploymentReceipt$);
}

async function deployLSP8IdentifiableDigitalAsset(
  signer: Signer,
  digitalAssetDeploymentOptions: DigitalAssetDeploymentOptions
) {
  const deploymentFunction = async () => {
    return await new LSP8__factory(signer).deploy(
      digitalAssetDeploymentOptions.name,
      digitalAssetDeploymentOptions.symbol,
      digitalAssetDeploymentOptions.ownerAddress
    );
  };

  return deployContract(deploymentFunction, ContractNames.LSP7_DIGITAL_ASSET);
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
      const contract = await new LSP7Init__factory(signer).attach(result.receipt.contractAddress);
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
