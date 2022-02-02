import { providers } from 'ethers';
import { ethers, SignerWithAddress } from 'hardhat';

import { LSPFactory } from '../../../build/main/src/lib/lsp-factory';
import { lsp3ProfileJson } from './../../../test/lsp3-profile.mock';
import { DeploymentEvent } from './../interfaces';
import { ProxyDeployer } from './proxy-deployer';
import { UniversalProfile__factory } from '../../../build/main/src';

jest.setTimeout(60000);
jest.useRealTimers();
describe('LSP3UniversalProfile', () => {
  let baseContracts;
  let proxyDeployer: ProxyDeployer;
  let signer: SignerWithAddress;
  let provider: providers.Web3Provider;

  beforeAll(async () => {
    provider = ethers.provider;
    signer = (await ethers.getSigners())[0];
    proxyDeployer = new ProxyDeployer(signer);
    baseContracts = await proxyDeployer.deployBaseContracts();
  });
  it.skip('should deploy and set LSP3Profile data', (done) => {
    const myLSPFactory = new LSPFactory(provider, signer);

    const deployments$ = myLSPFactory.LSP3UniversalProfile.deployReactive({
      controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
      lsp3Profile: lsp3ProfileJson,
    });

    let events;

    deployments$.subscribe({
      next: (deploymentEvents: DeploymentEvent) => {
        events = deploymentEvents;
      },
      error: (error) => {
        expect(1).toEqual(error);
        done();
      },
      complete: async () => {
        const ownerAddress = await events.ERC725Account.contract.owner();
        // const keyManagerAddress = await events.KeyManager.contract.address;
        expect(ownerAddress).toEqual('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

        await events.ERC725Account.contract.setData(
          '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
          '0xbeefbeef',
          {
            from: await signer.getAddress(),
          }
        );
        const data = await events.ERC725Account.contract.getData(
          '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5'
        );

        expect(data).toEqual('0xbeefbeef');
        done();
      },
    });
  });
  it('should deploy and set LSP3Profile data', async () => {
    const myLSPFactory = new LSPFactory(
      provider,
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );

    const { ERC725Account, KeyManager } = await myLSPFactory.LSP3UniversalProfile.deploy({
      controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
      lsp3Profile: lsp3ProfileJson,
    });

    const universalProfile = UniversalProfile__factory.connect(ERC725Account.address, signer);

    const ownerAddress = await universalProfile.owner();
    expect(ownerAddress).toEqual(KeyManager.address);

    const data = await universalProfile.getData([
      '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
    ]);

    expect(data[0].startsWith('0x6f357c6a')).toBe(true);
  });
});
