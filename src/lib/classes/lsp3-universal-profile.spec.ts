import { Contract, providers } from 'ethers';
import { ethers, SignerWithAddress } from 'hardhat';

import { LSPFactory } from '../lsp-factory';

import { lsp3ProfileJson } from './../../../test/lsp3-profile.mock';
import { DeploymentEvent } from './../interfaces';
import { ProxyDeployer } from './proxy-deployer';
describe('LSP3UniversalProfile', () => {
  let baseContracts;
  let proxyDeployer: ProxyDeployer;
  let signer: SignerWithAddress;
  let provider: providers.Web3Provider;

  beforeAll(async () => {
    const provider = ethers.provider;
    signer = provider.getSigner();
    proxyDeployer = new ProxyDeployer(signer);
    baseContracts = await proxyDeployer.deployBaseContracts();
  });
  it.skip('should deploy and set LSP3Profile data', (done) => {
    const myLSPFactory = new LSPFactory(signer, provider);

    const deployments$ = myLSPFactory.LSP3UniversalProfile.deploy(
      {
        controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
        lsp3Profile: {
          json: lsp3ProfileJson,
          url: 'fake',
        },
      },
      {
        libAddresses: {
          lsp3AccountInit: baseContracts.lsp3Account.address,
          universalReceiverAddressStoreInit: baseContracts.universalReceiverAddressStore.address,
        },
      }
    );

    let events;

    deployments$.subscribe({
      next: (deploymentEvents: DeploymentEvent<Contract>) => {
        events = deploymentEvents;
      },
      error: (error) => {
        expect(1).toEqual(error);
        done();
      },
      complete: async () => {
        const ownerAddress = await events.LSP3Account.contract.owner();
        // const keyManagerAddress = await events.KeyManager.contract.address;
        expect(ownerAddress).toEqual('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

        await events.LSP3Account.contract.setData(
          '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
          '0xbeefbeef',
          {
            from: await signer.getAddress(),
          }
        );
        const data = await events.LSP3Account.contract.getData(
          '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5'
        );

        expect(data).toEqual('0xbeefbeef');
        done();
      },
    });
  });
});
