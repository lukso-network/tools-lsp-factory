import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';
import { NonceManager } from '@ethersproject/experimental';

import {
  LSP1UniversalReceiverDelegateInit,
  LSP1UniversalReceiverDelegateInit__factory,
  UniversalProfileInit,
  UniversalProfileInit__factory,
} from '../../';
import { getProxyByteCode } from '../helpers/deployment.helper';

export class ProxyDeployer {
  signer: Signer;
  baseContracts: {
    universalProfile: UniversalProfileInit;
    universalReceiverDelegate: LSP1UniversalReceiverDelegateInit;
  };

  constructor(signer: Signer) {
    this.signer = new NonceManager(signer);
  }

  async deployBaseContracts() {
    const universalProfile = await new UniversalProfileInit__factory(this.signer).deploy();
    const universalReceiverDelegate = await new LSP1UniversalReceiverDelegateInit__factory(
      this.signer
    ).deploy();

    this.baseContracts = {
      universalProfile,
      universalReceiverDelegate,
    };

    return this.baseContracts;
  }

  async deployProxyContract<T extends Contract>(contract: T) {
    const proxyTx = await this.signer.sendTransaction({
      data: getProxyByteCode(contract.address),
    });

    const proxyReceipt = await proxyTx.wait();

    return contract.attach(proxyReceipt.contractAddress);
  }
}
