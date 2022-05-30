import { Contract, ContractFactory, ContractInterface, providers, Signer } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { lastValueFrom, Observable } from 'rxjs';
import { catchError, endWith, shareReplay, switchMap, takeLast, tap } from 'rxjs/operators';

import {
  DeploymentEvent,
  DeploymentEventBaseContract,
  DeploymentEventCallbacks,
  DeploymentEventProxyContract,
  DeploymentEventStandardContract,
  DeploymentStatus,
  DeploymentType,
} from '../interfaces/deployment-events';

import { GAS_BUFFER, GAS_PRICE } from './config.helper';

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
      let functionName;

      switch (deploymentEvent.type) {
        case DeploymentType.PROXY:
          functionName = deploymentEvent.functionName;

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
        status: DeploymentStatus.COMPLETE,
        ...(deploymentEvent.type === DeploymentType.PROXY && {
          contractAddress: receipt.contractAddress,
        }),
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
  initArguments: (result) => Promise<unknown[]>,
  initializeFunctionSignature: string
): Observable<DeploymentEventProxyContract> {
  const initialize$ = deploymentEvent$.pipe(
    takeLast(1),
    switchMap(async (result) => {
      const contract = await factory.attach(result.receipt.contractAddress);
      const initializeParams = await initArguments(result);
      const gasEstimate = await contract.estimateGas.initialize(...initializeParams, {
        gasPrice: GAS_PRICE,
      });
      const transaction = await contract.initialize(...initializeParams, {
        gasLimit: gasEstimate.add(GAS_BUFFER),
        gasPrice: GAS_PRICE,
      });
      return {
        type: DeploymentType.TRANSACTION,
        contractName: result.contractName,
        functionName: initializeFunctionSignature,
        status: DeploymentStatus.PENDING,
        transaction,
      };
    }),
    shareReplay()
  );

  return initialize$ as unknown as Observable<DeploymentEventProxyContract>;
}

/**
 * Generic function which deploys a contract and returns a pending deployment event object
 *
 * @callback {callback} deployContractFunction
 * @param {*} - The callback which handles Contract deployment. Should return the deployed Contract instance
 *
 * @returns {DeploymentEventBase} Pending Deployment event including the transaction hash
 */
export async function deployContract(
  deployContractFunction,
  name: string
): Promise<DeploymentEventStandardContract> {
  const contract: Contract = await deployContractFunction();

  return {
    type: DeploymentType.DEPLOYMENT,
    status: DeploymentStatus.PENDING,
    contractName: name,
    transaction: contract.deployTransaction,
  };
}

export async function deployBaseContract(
  deployContractFunction,
  name: string
): Promise<DeploymentEventBaseContract> {
  const contract: Contract = await deployContractFunction();

  return {
    type: DeploymentType.BASE_CONTRACT,
    status: DeploymentStatus.PENDING,
    contractName: name,
    transaction: contract.deployTransaction,
  };
}

export async function deployProxyContract(
  abi: ContractInterface,
  deployContractFunction,
  name: string,
  signer: Signer
): Promise<DeploymentEventProxyContract> {
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

export function getDeployedByteCode(
  contractAddress: string,
  provider: providers.Web3Provider | providers.JsonRpcProvider
) {
  return provider.getCode(contractAddress);
}

export function waitForContractDeployment<T>(deployment$: Observable<DeploymentEvent>): Promise<T> {
  const contractAccumulator = {} as T;

  return lastValueFrom(
    deployment$.pipe(
      tap((deploymentEvent) => {
        if (!deploymentEvent.receipt || !deploymentEvent.receipt.contractAddress) {
          return;
        }

        if (deploymentEvent.type === DeploymentType.BASE_CONTRACT) {
          contractAccumulator[`${deploymentEvent.contractName}BaseContract`] = {
            address: deploymentEvent.receipt.contractAddress,
            receipt: deploymentEvent.receipt,
          };
        } else {
          contractAccumulator[deploymentEvent.contractName] = {
            address: deploymentEvent.receipt.contractAddress,
            receipt: deploymentEvent.receipt,
          };
        }
      }),
      endWith(contractAccumulator),
      shareReplay()
    )
  ) as Promise<T>;
}

export function isAddress(testAddress: string) {
  try {
    getAddress(testAddress);
    return true;
  } catch {
    return false;
  }
}

export function convertContractDeploymentOptionsVersion(providedVersion?: string) {
  let version: string, byteCode: string, libAddress: string;

  if (providedVersion && providedVersion.startsWith('0x')) {
    if (isAddress(providedVersion)) {
      libAddress = providedVersion;
    } else {
      byteCode = providedVersion;
    }
  } else if (providedVersion) {
    version = providedVersion;
  }

  return { version, byteCode, libAddress };
}

export async function resolveContractDeployment<T>(
  contractsPromise: Promise<T>,
  onDeployEvents: DeploymentEventCallbacks<T>
) {
  let contracts: T;

  if (onDeployEvents?.error) {
    try {
      contracts = await contractsPromise;
    } catch (error) {
      // Skip. Error is handled by subscribe block.
    }
  } else {
    // No error callback passed. Let calling code handle errors.
    contracts = await contractsPromise;
  }

  if (contracts && onDeployEvents?.complete) {
    onDeployEvents?.complete(contracts);
  }

  return contracts;
}
