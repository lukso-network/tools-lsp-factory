import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';
import { NonceManager } from '@ethersproject/experimental';

import {
  LSP1UniversalReceiverDelegateUP,
  LSP1UniversalReceiverDelegateUP__factory,
  LSP6KeyManagerInit,
  LSP6KeyManagerInit__factory,
  LSP7MintableInit__factory,
  LSP8MintableInit__factory,
  UniversalProfileInit,
  UniversalProfileInit__factory,
} from '../../';
import { NULL_ADDRESS } from '../helpers/config.helper';
import { getProxyByteCode } from '../helpers/deployment.helper';

export class ProxyDeployer {
  signer: Signer;
  baseContracts: {
    universalProfile: UniversalProfileInit;
    universalReceiverDelegate: LSP1UniversalReceiverDelegateUP;
    keyManager: LSP6KeyManagerInit;
  };

  constructor(signer: Signer) {
    this.signer = new NonceManager(signer);
  }

  async deployUniversalProfileBaseContracts() {
    const universalProfile = await new UniversalProfileInit__factory(this.signer).deploy();
    const universalReceiverDelegate = await new LSP1UniversalReceiverDelegateUP__factory(
      this.signer
    ).deploy();
    const keyManager = await new LSP6KeyManagerInit__factory(this.signer).deploy();

    this.baseContracts = {
      universalProfile,
      universalReceiverDelegate,
      keyManager,
    };

    return this.baseContracts;
  }

  async deployLSP7BaseContract() {
    const lsp7Init = await new LSP7MintableInit__factory(this.signer).deploy();
    await lsp7Init['initialize(string,string,address,bool)']('', '', NULL_ADDRESS, false);
    return lsp7Init;
  }

  async deployLSP8BaseContract() {
    const lsp8Init = await new LSP8MintableInit__factory(this.signer).deploy();
    await lsp8Init['initialize(string,string,address)']('', '', NULL_ADDRESS);
    return lsp8Init;
  }

  async deployProxyContract<T extends Contract>(contract: T) {
    const proxyTx = await this.signer.sendTransaction({
      data: getProxyByteCode(contract.address),
    });

    const proxyReceipt = await proxyTx.wait();

    return contract.attach(proxyReceipt.contractAddress);
  }
}
