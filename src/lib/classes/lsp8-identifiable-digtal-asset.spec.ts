import { providers } from 'ethers';
import { ethers, SignerWithAddress } from 'hardhat';
import { Observable } from 'rxjs';

import { DeploymentEvent, LSP8Mintable__factory, LSPFactory } from '../../../build/main/src/index';

import { ProxyDeployer } from './proxy-deployer';

jest.setTimeout(30000);
jest.useRealTimers();

describe('LSP8IdentifiableDigitalAsset', () => {
  let baseContract;
  let proxyDeployer: ProxyDeployer;
  let signer: SignerWithAddress;
  let provider: providers.JsonRpcProvider;

  beforeAll(async () => {
    provider = ethers.provider;
    signer = provider.getSigner();
    proxyDeployer = new ProxyDeployer(signer);
    baseContract = await proxyDeployer.deployLSP8BaseContract();
  });

  it('should deploy LSP8 Identifiable Digital asset', async () => {
    const myLSPFactory = new LSPFactory(
      provider,
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );

    const lsp8IdentifiableDigitalAsset = await myLSPFactory.LSP8IdentifiableDigitalAsset.deploy(
      {
        controllerAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        libAddress: baseContract.address,
      }
    );

    const LSP8IdentifiableDigitalAsset = LSP8Mintable__factory.connect(
      lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address,
      signer
    );

    const ownerAddress = await LSP8IdentifiableDigitalAsset.owner();
    expect(ownerAddress).toEqual('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  });

  it('should deploy reactive', (done) => {
    const myLSPFactory = new LSPFactory(provider, signer);

    const lsp8IdentifiableDigitalAsset$ = myLSPFactory.LSP8IdentifiableDigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        libAddress: baseContract.address,
        deployReactive: true,
      }
    ) as Observable<DeploymentEvent>;

    let lsp8Address: string;

    lsp8IdentifiableDigitalAsset$.subscribe({
      next: (deploymentEvent: DeploymentEvent) => {
        if (
          deploymentEvent.receipt?.contractAddress &&
          deploymentEvent.contractName === 'LSP8IdentifiableDigitalAsset'
        ) {
          lsp8Address = deploymentEvent.receipt.contractAddress;
        }
      },
      error: () => {
        done();
      },
      complete: async () => {
        const lsp7DigitalAsset = LSP8Mintable__factory.connect(lsp8Address, signer);

        const ownerAddress = await lsp7DigitalAsset.owner();
        expect(ownerAddress).toEqual(signer.address);
        done();
      },
    });
  });
});
