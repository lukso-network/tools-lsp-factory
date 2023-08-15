import { EventSigHashes } from '@lukso/lsp-smart-contracts';
import { Contract, ContractFactory, ContractInterface, ethers, providers, Signer } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { concat, from, lastValueFrom, Observable } from 'rxjs';
import {
  catchError,
  endWith,
  mergeMap,
  shareReplay,
  switchMap,
  takeLast,
  tap,
} from 'rxjs/operators';

import {
  DeploymentEvent,
  DeploymentEventBaseContract,
  DeploymentEventCallbacks,
  DeploymentEventProxyContract,
  DeploymentEventStandardContract,
  DeploymentEventTransaction,
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
      const contract = await factory.attach(
        result.receipt.contractAddress || getContractAddressFromDeploymentEvent(result)
      );
      const initializeParams = await initArguments(result);
      const gasEstimate = await contract.estimateGas.initialize(...initializeParams);
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
        let contractAddress: string;

        try {
          contractAddress =
            deploymentEvent.receipt.contractAddress ||
            getContractAddressFromDeploymentEvent(deploymentEvent);
        } catch {
          return;
        }

        if (!contractAddress || contractAccumulator[deploymentEvent.contractName]) return;

        if (deploymentEvent.type === DeploymentType.BASE_CONTRACT) {
          contractAccumulator[`${deploymentEvent.contractName}BaseContract`] = {
            address: deploymentEvent.receipt.contractAddress,
            receipt: deploymentEvent.receipt,
          };
        } else {
          contractAccumulator[deploymentEvent.contractName] = {
            address: contractAddress,
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

export function waitForBatchedPendingTransactions(
  pendingBatchedTransactionArray$: Observable<
    {
      type: DeploymentType;
      contractName: string;
      status: DeploymentStatus;
      functionName: string;
      pendingTransaction: Promise<ethers.ContractTransaction>;
    }[]
  >
): Observable<DeploymentEventTransaction> {
  const transactions$ = pendingBatchedTransactionArray$.pipe(
    switchMap((transactions) => {
      return from(transactions);
    }),
    mergeMap(async (transaction) => {
      return {
        type: transaction.type,
        contractName: transaction.contractName,
        functionName: transaction.functionName,
        status: transaction.status,
        transaction: await transaction.pendingTransaction,
      } as DeploymentEventTransaction;
    }),
    shareReplay()
  );

  const receipts$ = transactions$.pipe(
    mergeMap(async (deploymentEvent) => {
      return {
        type: deploymentEvent.type,
        contractName: deploymentEvent.contractName,
        functionName: deploymentEvent.functionName,
        status: DeploymentStatus.COMPLETE,
        receipt: await deploymentEvent.transaction.wait(),
      } as DeploymentEventTransaction;
    }),
    shareReplay()
  );

  return concat(transactions$, receipts$);
}

/**
 *
 * Finds the deployed contract address from a transaction receipt by extracting the address from the ContractCreated or Executed event, depending on whether the receipt is for a deployment or initialize transaction
 *
 * Used in cases where the new contract address is not returned in the contractAddress property of the receipt. Ie when signing transactions with a Universal Profile
 *
 * @param receipt
 * @returns contract address
 */
export const getContractAddressFromDeploymentEvent = (deploymentEvent: DeploymentEvent) => {
  const { logs } = deploymentEvent.receipt;

  let eventSignatureToSearch: string;

  switch (deploymentEvent.type) {
    case DeploymentType.DEPLOYMENT:
    case DeploymentType.PROXY: {
      eventSignatureToSearch = findLSP0EventSignatureByName('ContractCreated');
      break;
    }
    case DeploymentType.TRANSACTION: {
      eventSignatureToSearch = findLSP0EventSignatureByName('Executed');
      break;
    }
  }

  if (!eventSignatureToSearch) {
    throw new Error('Unable to get deployed contract address');
  }

  const log = logs.find((log) => {
    return (
      log.topics.filter((topic) => {
        return topic === eventSignatureToSearch;
      }).length > 0
    );
  });

  const address = log
    ? ethers.utils.defaultAbiCoder.decode(['address'], log.topics[2]).toString()
    : null;

  return address;
};

const findLSP0EventSignatureByName = (name: string): string => {
  return (
    Object.entries(EventSigHashes.LSP0ERC725Account).find(
      ([, value]) => value.name === name
    )?.[0] || ''
  );
};
