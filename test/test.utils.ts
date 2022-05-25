import crypto from 'crypto';

import { Signer } from '@ethersproject/abstract-signer';
import { NonceManager } from '@ethersproject/experimental';

import { UniversalProfile__factory } from '../types/ethers-v5/factories/UniversalProfile__factory';
import { LSP6KeyManager__factory } from '../types/ethers-v5/factories/LSP6KeyManager__factory';
import { LSP1UniversalReceiverDelegateUP__factory } from '../types/ethers-v5/factories/LSP1UniversalReceiverDelegateUP__factory';
import { ContractDeploymentOptions, LSPFactory } from '../build/main/src';
import { ContractNames, DeployedContracts } from '../src/lib/interfaces';
import { getDeployedByteCode, getProxyByteCode } from '../src/lib/helpers/deployment.helper';
import { providers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';

export async function deployUniversalProfileContracts(signer: Signer, owner: string) {
  let nonceManager = new NonceManager(signer);
  let signerAddress = await signer.getAddress();

  let universalProfile = await new UniversalProfile__factory(nonceManager).deploy(signerAddress);
  let keyManager = await new LSP6KeyManager__factory(nonceManager).deploy(universalProfile.address);
  let universalReceiverDelegate = await new LSP1UniversalReceiverDelegateUP__factory(
    nonceManager
  ).deploy();

  return {
    universalProfile,
    keyManager,
    universalReceiverDelegate,
  };
}

export async function testUPDeployment(
  contractDeploymentOptions: ContractDeploymentOptions,
  expectedContractNumber: number,
  lspFactory: LSPFactory,
  controllerAddresses: string[]
) {
  const deployedContracts = await lspFactory.LSP3UniversalProfile.deploy(
    {
      controllerAddresses,
    },
    contractDeploymentOptions
  );

  expect(Object.keys(deployedContracts).length).toEqual(expectedContractNumber);

  const contractNames = [ContractNames.ERC725_Account, ContractNames.KEY_MANAGER];

  for (const contractName of contractNames) {
    if (
      contractDeploymentOptions[contractName]?.version?.startsWith('0x') ||
      contractDeploymentOptions[contractName]?.deployProxy === false
    ) {
      expect(deployedContracts[`${contractName}BaseContract`]).toBeUndefined();
    } else {
      expect(deployedContracts[`${contractName}BaseContract`]).toBeDefined();
    }
  }

  if (
    contractDeploymentOptions?.LSP1UniversalReceiverDelegate?.deployProxy &&
    !isAddress(contractDeploymentOptions?.LSP1UniversalReceiverDelegate.version)
  ) {
    expect(deployedContracts[`LSP1UniversalReceiverDelegateBaseContract`]).toBeDefined();
  } else {
    expect(deployedContracts[`LSP1UniversalReceiverDelegateBaseContract`]).toBeUndefined();
  }

  return deployedContracts as DeployedContracts;
}

function isAddress(address: string) {
  try {
    getAddress(address);
    return true;
  } catch {
    return false;
  }
}

export async function testSetData(upAddress: string, keyManagerAddress: string, signer: Signer) {
  const key = '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5';
  const value = '0x' + crypto.randomBytes(32).toString('hex');

  const universalProfile = UniversalProfile__factory.connect(upAddress, signer);

  const keyManager = LSP6KeyManager__factory.connect(keyManagerAddress, signer);

  const abi = await universalProfile.populateTransaction.setData([key], [value]);

  const result = await keyManager.connect(signer).execute(abi.data);
  expect(result).toBeTruthy();

  const data = await universalProfile.getData([key]);
  expect(data).toEqual([value]);
}

export async function testProxyBytecodeContainsAddress(
  proxyAddress: string,
  baseContractAddress: string,
  provider: providers.Web3Provider | providers.JsonRpcProvider
) {
  const bytecode = await getDeployedByteCode(proxyAddress, provider);

  expect(bytecode).toContain(baseContractAddress.slice(0, 2));
}
