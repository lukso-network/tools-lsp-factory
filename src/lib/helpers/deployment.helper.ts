import { Contract, ContractFactory, Signer } from 'ethers';
import { Observable } from 'rxjs';
import { shareReplay, switchMap, takeLast } from 'rxjs/operators';

import {
  ContractDeploymentOptions,
  DeploymentEvent,
  DeploymentEventProxyContract,
  DeploymentEventStandardContract,
  DeploymentStatus,
  DeploymentType,
} from '../interfaces/profile-deployment';

const BASE_CONTRACT_ADDRESS = '_BASE_CONTRACT_ADDRESS_';
const proxyRuntimeCodeTemplate = `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${BASE_CONTRACT_ADDRESS}5af43d82803e903d91602b57fd5bf3`;

export function waitForReceipt<T>(deploymentEvent$): Observable<T> {
  const receipt$ = deploymentEvent$.pipe(
    switchMap(async (result: DeploymentEvent) => {
      let receipt, status, functionName;

      switch (result.type) {
        case DeploymentType.CONTRACT:
          receipt = await result.transaction.wait();
          status = DeploymentStatus.COMPLETE;
          break;
        case DeploymentType.PROXY:
          // this is pending because there is an additional step (initialize)
          receipt = await result.transaction.wait();
          status = result.functionName ? DeploymentStatus.COMPLETE : DeploymentStatus.PENDING;
          functionName = result.functionName;
          break;
        case DeploymentType.TRANSACTION:
          receipt = await result.transaction.wait();
          status = DeploymentStatus.COMPLETE;
          functionName = result.functionName;
          break;
      }

      return {
        type: result.type,
        contractName: result.contractName,
        ...(functionName && { functionName }),
        status,
        receipt,
      };
    })
  );

  return receipt$;
}

export function initialize(
  deploymentEvent$: Observable<DeploymentEvent>,
  factory: ContractFactory,
  initArguments: (result) => unknown[]
): Observable<DeploymentEventProxyContract> {
  const initialize$ = deploymentEvent$.pipe(
    takeLast(1),
    switchMap(async (result) => {
      const contract = await factory.attach(result.receipt.contractAddress);
      const initializeParams = initArguments(result);
      const transaction = await contract.initialize(...initializeParams);
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
/**
 * TODO: docs
 */
export async function deployContract(
  deployContractFunction,
  name: string
): Promise<DeploymentEventStandardContract> {
  try {
    const contract: Contract = await deployContractFunction();

    return {
      type: DeploymentType.CONTRACT,
      status: DeploymentStatus.PENDING,
      contractName: name,
      transaction: contract.deployTransaction,
    };
  } catch (error) {
    console.error(`Error when deploying ${name}`, error);
    throw error;
  }
}

export async function deployProxyContract<T extends Contract>(
  deployContractFunction,
  name: string,
  signer: Signer
): Promise<DeploymentEventProxyContract> {
  try {
    const contract: T = await deployContractFunction();

    const byteCode = proxyRuntimeCodeTemplate.replace(
      BASE_CONTRACT_ADDRESS,
      contract.address.substr(2)
    );
    const transaction = await signer.sendTransaction({
      data: byteCode,
    });

    return {
      type: DeploymentType.PROXY,
      contractName: name,
      status: DeploymentStatus.PENDING,
      transaction,
    };
  } catch (error) {
    console.error(`Error when deploying ${name}`, error);
    throw error;
  }
}

export function getBaseContractAddresses(contractDeploymentOptions: ContractDeploymentOptions) {
  return contractDeploymentOptions.libAddresses;
}
