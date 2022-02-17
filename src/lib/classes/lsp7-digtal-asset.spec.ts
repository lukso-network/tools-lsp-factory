import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { providers } from 'ethers';
import { ethers } from 'hardhat';
import { Observable } from 'rxjs';

import { DeploymentEvent, LSP7Mintable__factory, LSPFactory } from '../../../build/main/src/index';
import { DeployedLSP7DigitalAsset } from '../../../build/main/src/lib/interfaces/digital-asset-deployment';

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

    const lsp7DigitalAsset = (await myLSPFactory.LSP7DigitalAsset.deploy({
      controllerAddress: signer.address,
      isNFT: false,
      name: 'TOKEN',
      symbol: 'TKN',
    })) as DeployedLSP7DigitalAsset;

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

    const lsp7DigitalAsset = (await myLSPFactory.LSP7DigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        isNFT: false,
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        libAddress: baseContract.address,
      }
    )) as DeployedLSP7DigitalAsset;

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

    const lsp7DigitalAsset = (await myLSPFactory.LSP7DigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        isNFT: false,
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        deployProxy: false,
      }
    )) as DeployedLSP7DigitalAsset;

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
      error: (error) => {
        // Fail to exit subsciber
        expect(1).toEqual(error);
      },
      complete: async () => {
        const lsp7DigitalAsset = LSP7Mintable__factory.connect(lsp7Address, signer);

        const ownerAddress = await lsp7DigitalAsset.owner();
        expect(ownerAddress).toEqual(signer.address);

        done();
      },
    });
  });

  it('should deploy lsp7 with custom bytecode', async () => {
    const lspFactory = new LSPFactory(provider, signer);

    const passedBytecode = LSP7Mintable__factory.bytecode;

    const lsp7DigitalAsset = (await lspFactory.LSP7DigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        isNFT: false,
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        byteCode: passedBytecode,
      }
    )) as DeployedLSP7DigitalAsset;

    expect(lsp7DigitalAsset.LSP7DigitalAsset.address).toBeDefined();
    expect(Object.keys(lsp7DigitalAsset).length).toEqual(1);

    const LSP7DigitalAsset = LSP7Mintable__factory.connect(
      lsp7DigitalAsset.LSP7DigitalAsset.address,
      signer
    );

    const ownerAddress = await LSP7DigitalAsset.owner();
    expect(ownerAddress).toEqual(signer.address);

    const mintBalance = 10;
    const mintAddress = '0x1da537A8D1979b25794FB07d694119574f4f46Cf';

    const mint = await LSP7DigitalAsset.mint(mintAddress, mintBalance, true, '0x');

    expect(mint).toBeTruthy();
    await mint.wait();

    const actualMintBalance = (await LSP7DigitalAsset.balanceOf(mintAddress)).toNumber();
    expect(actualMintBalance).toEqual(mintBalance);
  });
});
