import { Signer } from 'ethers';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import {
  KeyManager,
  KeyManager__factory,
  LSP3Account,
  LSP3Account__factory,
  UniversalReceiverAddressStore,
  UniversalReceiverAddressStore__factory,
} from '../../../types/ethers-v5';
import {
  DEPLOYMENT_EVENT,
  DeploymentEventContract,
} from '../interfaces/profile-deployment-options';

export function waitForReceipt(deploymentEvent$: Observable<any>) {
  const receipt$ = deploymentEvent$.pipe(
    switchMap(async (result) => {
      const receipt =
        result.type === DEPLOYMENT_EVENT.CONTRACT
          ? await result.contract.deployTransaction.wait()
          : await result.transaction.wait();

      return {
        ...result,
        receipt,
      };
    })
  );

  return receipt$;
}
/**
 * TODO: docs
 */
export async function deployContract<T>(
  deployContractFunction,
  name: string
): Promise<DeploymentEventContract<T>> {
  try {
    const contract: T = await deployContractFunction();

    return {
      type: DEPLOYMENT_EVENT.CONTRACT,
      name,
      contract,
    };
  } catch (error) {
    console.error(`Error when deploying ${name}`, error);
    throw error;
  }
}

/**
 * TODO: docs
 */
export async function deployLSP3Account(signer: Signer, ownerAddress: string) {
  const deploymentFunction = async () => {
    return await new LSP3Account__factory(signer).deploy(ownerAddress);
  };
  return deployContract<LSP3Account>(deploymentFunction, 'LSP3Account');
}

/**
 * TODO: docs
 */
export async function deployKeyManager(signer: Signer, address: string) {
  const deploymentFunction = async () => {
    return await new KeyManager__factory(signer).deploy(address);
  };

  return deployContract<KeyManager>(deploymentFunction, 'KeyManager');
}

/**
 * TODO: docs
 */
export async function deployUniversalReceiverAddressStore(
  signer: Signer,
  lsp3AccountAddress: string
) {
  const deploymentFunction = async () => {
    return await new UniversalReceiverAddressStore__factory(signer).deploy(lsp3AccountAddress);
  };

  return deployContract<UniversalReceiverAddressStore>(
    deploymentFunction,
    'UniversalReceiverAddressStore'
  );
}
