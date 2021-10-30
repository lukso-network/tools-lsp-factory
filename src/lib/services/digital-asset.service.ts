import { Signer } from '@ethersproject/abstract-signer';
import { concat, defer } from 'rxjs';

import { LSP7__factory } from '../../tmp/Factories/LSP7__factory';
import { LSP8__factory } from '../../tmp/Factories/LSP8__factory';
import { deployContract, waitForReceipt } from '../helpers/deployment.helper';
import { DeploymentEventContract, DeploymentEventProxyContract } from '../interfaces';
import {
  ContractNames,
  DigitalAssetDeploymentOptions,
  LSP7DigitalAssetDeploymentOptions,
} from '../interfaces/digital-asset-deployment';

export type DigitalAssetDeploymentEvent = DeploymentEventContract | DeploymentEventProxyContract;

export function lsp7DigitalAssetDeployment$(
  signer: Signer,
  digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions
) {
  // TODO: implemet Proxy deployment

  const digitalAssetDeployment$ = defer(() =>
    deployLSP7DigitalAsset(signer, digitalAssetDeploymentOptions)
  );

  const digitalAssetDeploymentReceipt$ =
    waitForReceipt<DigitalAssetDeploymentEvent>(digitalAssetDeployment$);

  return concat(digitalAssetDeployment$, digitalAssetDeploymentReceipt$);
}

async function deployLSP7DigitalAsset(
  signer: Signer,
  digitalAssetDeploymentOptions: LSP7DigitalAssetDeploymentOptions
) {
  const deploymentFunction = async () => {
    return await new LSP7__factory(signer).deploy(
      digitalAssetDeploymentOptions.name,
      digitalAssetDeploymentOptions.symbol,
      digitalAssetDeploymentOptions.ownerAddress,
      digitalAssetDeploymentOptions.isNFT
    );
  };

  return deployContract(deploymentFunction, ContractNames.LSP7_DIGITAL_ASSET);
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
