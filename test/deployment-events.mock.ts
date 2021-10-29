import { ContractNames, DeploymentStatus, DeploymentType } from '../src';

const proxyDeploymentEventBase = {
  type: DeploymentType.PROXY,
  contractName: ContractNames.ERC725_ACCOUNT,
  status: DeploymentStatus.PENDING,
  transaction: {
    wait: async () => {
      return 'fake receipt';
    },
  },
};
export const defaultDeploymentEvents = {
  [DeploymentType.PROXY]: {
    [ContractNames.ERC725_ACCOUNT]: {
      deployment: {
        ...proxyDeploymentEventBase,
      },
      deploymentReceipt: {
        ...proxyDeploymentEventBase,
        receipt: {
          contractAddress: '0x...',
        },
      },
      initialize: {
        ...proxyDeploymentEventBase,
        functionName: 'initialize',
      },
      error: {
        ...proxyDeploymentEventBase,
        transaction: {
          wait: () => {
            throw Error('failed');
          },
        },
      },
    },
  },
};
