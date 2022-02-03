import { Signer } from '@ethersproject/abstract-signer';
import { NonceManager } from '@ethersproject/experimental';

import { UniversalProfile__factory } from '../types/ethers-v5/factories/UniversalProfile__factory';
import { LSP6KeyManager__factory } from '../types/ethers-v5/factories/LSP6KeyManager__factory';
import { LSP1UniversalReceiverDelegate__factory } from '../types/ethers-v5/factories/LSP1UniversalReceiverDelegate__factory';

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
