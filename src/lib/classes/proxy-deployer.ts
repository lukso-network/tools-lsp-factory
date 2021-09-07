import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';

import { LSP3AccountInit__factory } from '../../tmp/Factories/LSP3AccountInit__factory';
import { UniversalReceiverAddressStoreInit__factory } from '../../tmp/Factories/UniversalReceiverAddressStoreInit__factory';
import { LSP3AccountInit } from '../../tmp/LSP3AccountInit';
import { UniversalReceiverAddressStoreInit } from '../../tmp/UniversalReceiverAddressStoreInit';

// interface InitContracts {
//   LSP3Account: LSP3AccountInit__factory;
//   UniversalReceiverAddressStore: UniversalReceiverAddressStoreInit__factory;
// }

// const contractMapping = {
//   LSP3Account: LSP3AccountInit__factory,
//   UniversalReceiverAddressStore: UniversalReceiverAddressStoreInit__factory,
// };

const runtimeCodeTemplate =
  '0x3d602d80600a3d3981f3363d3d373d3d3d363d73MASTER_CONTRACT_ADDRESS5af43d82803e903d91602b57fd5bf3';

export class ProxyDeployer {
  signer: Signer;
  masterContracts: {
    lsp3Account: LSP3AccountInit;
    universalReceiverAddressStore: UniversalReceiverAddressStoreInit;
  };
  constructor(signer: Signer) {
    this.signer = signer;
  }
  // masterContracts$: Observable<any>;
  async deployMasterContracts() {
    const lsp3Account = await new LSP3AccountInit__factory(this.signer).deploy();
    const universalReceiverAddressStore = await new UniversalReceiverAddressStoreInit__factory(
      this.signer
    ).deploy();

    this.masterContracts = {
      lsp3Account,
      universalReceiverAddressStore,
    };

    return this.masterContracts;
    // const deployedContracts = Object.entries(this.masterContracts).reduce(
    //   this.deployProxyContract.bind(this),
    //   {} as {
    //     lsp3Account: LSP3AccountInit;
    //     universalReceiverAddressStore: UniversalReceiverAddressStoreInit;
    //   }
    // );
    // return deployedContracts;
  }

  async deployProxyContract<T extends Contract>(contract: T) {
    const byteCode = runtimeCodeTemplate.replace(
      'MASTER_CONTRACT_ADDRESS',
      contract.address.substr(2)
    );
    const proxyTx = await this.signer.sendTransaction({
      data: byteCode,
    });

    const proxyReceipt = await proxyTx.wait();

    return contract.attach(proxyReceipt.contractAddress);
  }
}
