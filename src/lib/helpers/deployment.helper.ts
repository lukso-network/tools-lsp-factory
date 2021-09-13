import { Contract, ContractFactory, ContractInterface, Signer } from 'ethers';
import { Observable } from 'rxjs';
import { catchError, shareReplay, switchMap, takeLast } from 'rxjs/operators';

import {
  ContractDeploymentOptions,
  DeploymentEvent,
  DeploymentEventProxyContract,
  DeploymentEventStandardContract,
  DeploymentStatus,
  DeploymentType,
} from '../interfaces/profile-deployment';

/**
 *
 *
 * @export
 * @template T
 * @param {*} deploymentEvent$
 * @return {*}  {Observable<T>}
 */
export function waitForReceipt<T>(deploymentEvent$): Observable<T> {
  return deploymentEvent$.pipe(
    switchMap(async (deploymentEvent: DeploymentEvent) => {
      let status, functionName;

      status = DeploymentStatus.COMPLETE;

      switch (deploymentEvent.type) {
        case DeploymentType.PROXY:
          functionName = deploymentEvent.functionName;
          status = functionName ? DeploymentStatus.COMPLETE : DeploymentStatus.PENDING;
          break;
        case DeploymentType.TRANSACTION:
          functionName = deploymentEvent.functionName;
          break;
      }
      const receipt = await deploymentEvent.transaction.wait();
      return {
        type: deploymentEvent.type,
        contractName: deploymentEvent.contractName,
        ...(functionName && { functionName }),
        status,
        receipt,
      };
    }),
    catchError((error: Error) => {
      const message = 'Error when waiting for the transaction receipt: ' + error.message;
      throw new Error(message);
    })
  );
}

export function initialize(
  deploymentEvent$: Observable<DeploymentEvent>,
  factory: ContractFactory,
  initArguments: (result) => Promise<unknown[]>
): Observable<DeploymentEventProxyContract> {
  const initialize$ = deploymentEvent$.pipe(
    takeLast(1),
    switchMap(async (result) => {
      const contract = await factory.attach(result.receipt.contractAddress);
      const initializeParams = await initArguments(result);
      const transaction = await contract.initialize(...initializeParams, { gasLimit: 3_000_000 });
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

export async function deployProxyContract(
  abi: ContractInterface,
  deployContractFunction,
  name: string,
  signer: Signer
): Promise<DeploymentEventProxyContract> {
  try {
    const contract: Contract = await deployContractFunction();
    const factory = new ContractFactory(abi, getProxyByteCode(contract.address), signer);
    const deployedProxy = await factory.deploy();
    const transaction = deployedProxy.deployTransaction;

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

/**
 * Produces the bytecode needed to deploy a minimal proxy contract
 * https://eips.ethereum.org/EIPS/eip-1167
 *
 * @export
 * @param {string} address
 * @return {string}
 */
export function getProxyByteCode(address: string) {
  // prettier-ignore
  return `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${address.substr(2)}5af43d82803e903d91602b57fd5bf3`;
}

export function getBaseContractAddresses(contractDeploymentOptions: ContractDeploymentOptions) {
  return contractDeploymentOptions.libAddresses;
}
