import { Contract, ContractFactory, Signer } from 'ethers';
import { Observable } from 'rxjs';
import { shareReplay, switchMap, takeLast } from 'rxjs/operators';

import {
  ContractDeploymentOptions,
  DeploymentEvent,
  DeploymentEventProxyContract,
  DeploymentEventStandardContract,
  DeploymentEventStatus,
  DeploymentEventType,
} from '../interfaces/profile-deployment';

const runtimeCodeTemplate =
  '0x3d602d80600a3d3981f3363d3d373d3d3d363d73MASTER_CONTRACT_ADDRESS5af43d82803e903d91602b57fd5bf3';

export function waitForReceipt<T>(deploymentEvent$): Observable<T> {
  const receipt$ = deploymentEvent$.pipe(
    switchMap(async (result: DeploymentEvent<Contract>) => {
      let receipt, status;

      switch (result.type) {
        case DeploymentEventType.CONTRACT:
          receipt = await result.contract.deployTransaction.wait();
          status = DeploymentEventStatus.SUCCESS;
          break;
        case DeploymentEventType.PROXY_CONTRACT:
          receipt = await result.transaction.wait();
          status = DeploymentEventStatus.INITIALIZING;
          break;
        case DeploymentEventType.TRANSACTION:
          receipt = await result.transaction.wait();
          status = DeploymentEventStatus.SUCCESS;
          break;
      }

      return {
        ...result,
        status,
        receipt,
      };
    })
  );

  return receipt$;
}

export function initialize<T extends Contract>(
  deploymentEvent$: Observable<DeploymentEvent<T>>,
  factory: ContractFactory,
  initArguments: any
): Observable<DeploymentEventProxyContract<T>> {
  const initialize$ = deploymentEvent$.pipe(
    takeLast(1),
    switchMap(async (result) => {
      const contract = await factory.attach(result.receipt.contractAddress);
      const initializeParams = initArguments(result);
      const init = await contract.initialize(...initializeParams);
      const initReceipt = await init.wait();
      return {
        ...result,
        status: DeploymentEventStatus.SUCCESS,
        contract,
        initReceipt,
      };
    }),
    shareReplay()
  );

  return initialize$ as unknown as Observable<DeploymentEventProxyContract<T>>;
}
/**
 * TODO: docs
 */
export async function deployContract<T>(
  deployContractFunction,
  name: string
): Promise<DeploymentEventStandardContract<T>> {
  try {
    const contract: T = await deployContractFunction();

    return {
      type: DeploymentEventType.CONTRACT,
      status: DeploymentEventStatus.DEPLOYING,
      name,
      contract,
    };
  } catch (error) {
    console.error(`Error when deploying ${name}`, error);
    throw error;
  }
}

export async function deployProxyContract<T extends Contract>(
  deployContractFunction,
  name: string,
  signer: Signer,
  initArguments: any[]
): Promise<DeploymentEventProxyContract<T>> {
  try {
    const contract: T = await deployContractFunction();

    const byteCode = runtimeCodeTemplate.replace(
      'MASTER_CONTRACT_ADDRESS',
      contract.address.substr(2)
    );
    const transaction = await signer.sendTransaction({
      data: byteCode,
    });

    return {
      type: DeploymentEventType.PROXY_CONTRACT,
      status: DeploymentEventStatus.DEPLOYING,
      name,
      transaction,
      initArguments,
    };
  } catch (error) {
    console.error(`Error when deploying ${name}`, error);
    throw error;
  }
}

export function getMasterContractAddresses(contractDeploymentOptions: ContractDeploymentOptions) {
  return contractDeploymentOptions.libAddresses;
}
