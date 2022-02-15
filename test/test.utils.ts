import crypto from 'crypto';

import { Signer } from '@ethersproject/abstract-signer';
import { NonceManager } from '@ethersproject/experimental';

import { UniversalProfile__factory } from '../types/ethers-v5/factories/UniversalProfile__factory';
import { LSP6KeyManager__factory } from '../types/ethers-v5/factories/LSP6KeyManager__factory';
import { LSP1UniversalReceiverDelegate__factory } from '../types/ethers-v5/factories/LSP1UniversalReceiverDelegate__factory';
import { LSPFactory } from '../build/main/src';
import { DeployedContracts } from '../src/lib/interfaces';

export async function deployUniversalProfileContracts(signer: Signer, owner: string) {
  let nonceManager = new NonceManager(signer);
  let signerAddress = await signer.getAddress();

  let universalProfile = await new UniversalProfile__factory(nonceManager).deploy(signerAddress);
  let keyManager = await new LSP6KeyManager__factory(nonceManager).deploy(universalProfile.address);
  let universalReceiverDelegate = await new LSP1UniversalReceiverDelegate__factory(
    nonceManager
  ).deploy();

  return {
    universalProfile,
    keyManager,
    universalReceiverDelegate,
  };
}

export async function testUPDeploymentWithBaseContractFlag(
  deployBaseContracts: {
    ERC725Account: boolean;
    KeyManager: boolean;
    UniversalReceiverDelegate: boolean;
  },
  expectedContractNumber: number,
  lspFactory: LSPFactory,
  controllerAddresses: string[]
): Promise<DeployedContracts> {
  const deployedContracts = await lspFactory.LSP3UniversalProfile.deploy(
    {
      controllerAddresses,
    },
    {
      ERC725Account: { deployProxy: deployBaseContracts.ERC725Account },
      KeyManager: { deployProxy: deployBaseContracts.KeyManager },
      UniversalReceiverDelegate: { deployProxy: deployBaseContracts.UniversalReceiverDelegate },
    }
  );

  expect(Object.keys(deployedContracts).length).toEqual(expectedContractNumber);

  const contractNames = Object.keys(deployedContracts);
  const deployBaseContract = Object.values(deployedContracts);

  for (const contractName of contractNames) {
    if (deployBaseContract[contractName]) {
      expect(deployedContracts[`${contractName}BaseContract`]).toBeDefined();
    }

    if (deployBaseContract[contractName] === false) {
      expect(deployedContracts[`${contractName}BaseContract`]).toBeUndefined();
    }
  }
  return deployedContracts as DeployedContracts;
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