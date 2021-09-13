import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';
import { NonceManager } from '@ethersproject/experimental';

import { LSP3AccountInit__factory } from '../../tmp/Factories/LSP3AccountInit__factory';
import { UniversalReceiverAddressStoreInit__factory } from '../../tmp/Factories/UniversalReceiverAddressStoreInit__factory';
import { LSP3AccountInit } from '../../tmp/LSP3AccountInit';
import { UniversalReceiverAddressStoreInit } from '../../tmp/UniversalReceiverAddressStoreInit';
import { getProxyByteCode } from '../helpers/deployment.helper';

export class ProxyDeployer {
  signer: Signer;
  baseContracts: {
    lsp3Account: LSP3AccountInit;
    universalReceiverAddressStore: UniversalReceiverAddressStoreInit;
  };

  constructor(signer: Signer) {
    this.signer = new NonceManager(signer);
  }

  async deployBaseContracts() {
    const lsp3Account = await new LSP3AccountInit__factory(this.signer).deploy();
    const universalReceiverAddressStore = await new UniversalReceiverAddressStoreInit__factory(
      this.signer
    ).deploy();

    this.baseContracts = {
      lsp3Account,
      universalReceiverAddressStore,
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
