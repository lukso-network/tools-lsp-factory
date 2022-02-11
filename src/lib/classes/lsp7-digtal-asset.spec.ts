import { providers } from 'ethers';
import { ethers, SignerWithAddress } from 'hardhat';
import { Observable } from 'rxjs';

import { DeploymentEvent, LSP7Mintable__factory, LSPFactory } from '../../../build/main/src/index';

import { ProxyDeployer } from './proxy-deployer';

jest.setTimeout(30000);
jest.useRealTimers();

describe('LSP7DigitalAsset', () => {
  let baseContract;
  let proxyDeployer: ProxyDeployer;
  let signer: SignerWithAddress;
  let provider: providers.JsonRpcProvider;

  beforeAll(async () => {
    provider = ethers.provider;
    signer = (await ethers.getSigners())[0];
    proxyDeployer = new ProxyDeployer(signer);
    baseContract = await proxyDeployer.deployLSP7BaseContract();
  });

  it('should deploy LSP7 Digital asset with no passed deployment options', async () => {
    const myLSPFactory = new LSPFactory(provider, signer);

    const lsp7DigitalAsset = await myLSPFactory.LSP7DigitalAsset.deploy({
      controllerAddress: signer.address,
      isNFT: false,
      name: 'TOKEN',
      symbol: 'TKN',
    });

    expect(lsp7DigitalAsset.LSP7DigitalAsset.address).toBeDefined();
    expect(Object.keys(lsp7DigitalAsset).length).toEqual(2);

    const LSP7DigitalAsset = LSP7Mintable__factory.connect(
      lsp7DigitalAsset.LSP7DigitalAsset.address,
      signer
    );

    const ownerAddress = await LSP7DigitalAsset.owner();
    expect(ownerAddress).toEqual(signer.address);
  });

  it('should deploy LSP7 Digital asset from specified base contract', async () => {
    const myLSPFactory = new LSPFactory(provider, signer);

    const lsp7DigitalAsset = await myLSPFactory.LSP7DigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        isNFT: false,
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        libAddress: baseContract.address,
      }
    );

    expect(lsp7DigitalAsset.LSP7DigitalAsset.address).toBeDefined();
    expect(Object.keys(lsp7DigitalAsset).length).toEqual(1);

    const LSP7DigitalAsset = LSP7Mintable__factory.connect(
      lsp7DigitalAsset.LSP7DigitalAsset.address,
      signer
    );

    const ownerAddress = await LSP7DigitalAsset.owner();
    expect(ownerAddress).toEqual(signer.address);
  });

  it('should deploy LSP7 Digital asset without a base contract', async () => {
    const myLSPFactory = new LSPFactory(provider, signer);

    const lsp7DigitalAsset = await myLSPFactory.LSP7DigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        isNFT: false,
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        deployProxy: false,
      }
    );

    expect(lsp7DigitalAsset.LSP7DigitalAsset.address).toBeDefined();
    expect(Object.keys(lsp7DigitalAsset).length).toEqual(1);

    const LSP7DigitalAsset = LSP7Mintable__factory.connect(
      lsp7DigitalAsset.LSP7DigitalAsset.address,
      signer
    );

    const ownerAddress = await LSP7DigitalAsset.owner();
    expect(ownerAddress).toEqual(signer.address);
  });

  it('should deploy reactive', (done) => {
    const myLSPFactory = new LSPFactory(provider, signer);

    const lsp7DigitalAsset$ = myLSPFactory.LSP7DigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        isNFT: false,
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        deployReactive: true,
        deployProxy: true,
      }
    ) as Observable<DeploymentEvent>;

    let lsp7Address: string;

    lsp7DigitalAsset$.subscribe({
      next: (deploymentEvent: DeploymentEvent) => {
        if (
          deploymentEvent.receipt?.contractAddress &&
          deploymentEvent.contractName === 'LSP7DigitalAsset'
        ) {
          lsp7Address = deploymentEvent.receipt.contractAddress;
        }
      },
      error: () => {
        done();
      },
      complete: async () => {
        const lsp7DigitalAsset = LSP7Mintable__factory.connect(lsp7Address, signer);

        const ownerAddress = await lsp7DigitalAsset.owner();
        expect(ownerAddress).toEqual(signer.address);

        done();
      },
    });
  });
});
