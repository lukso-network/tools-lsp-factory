import { Signer } from '@ethersproject/abstract-signer';
import { NonceManager } from '@ethersproject/experimental';

import { UniversalProfile__factory } from '../types/ethers-v5/factories/UniversalProfile__factory';
import { LSP6KeyManager__factory } from '../types/ethers-v5/factories/LSP6KeyManager__factory';
import { LSP1UniversalReceiverDelegate__factory } from '../types/ethers-v5/factories/LSP1UniversalReceiverDelegate__factory';
import { LSPFactory } from '../build/main/src';

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
  baseContracts,
  expectedContractNumber: number,
  lspFactory: LSPFactory
) {
  const deployedContracts = await lspFactory.LSP3UniversalProfile.deploy(
    {
      controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
    },
    {
      ERC725Account: { baseContract: baseContracts.ERC725Account },
      KeyManager: { baseContract: baseContracts.KeyManager },
      UniversalReceiverDelegate: { baseContract: baseContracts.ERC725Account },
    }
  );

  expect(Object.keys(deployedContracts).length).toEqual(expectedContractNumber);

  const contractNames = Object.keys(deployedContracts);
  const deployBaseContract = Object.values(deployedContracts);

  for (let i; i < contractNames.length; i++) {
    if (deployBaseContract[i]) expect(deployedContracts[contractNames[i]]).toBeDefined();
  }
}
