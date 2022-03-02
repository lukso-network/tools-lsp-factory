import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { providers } from 'ethers';
import { ethers } from 'hardhat';
import { Observable } from 'rxjs';

import {
  DeploymentEvent,
  LSP7Mintable,
  LSP7Mintable__factory,
  LSPFactory,
} from '../../../build/main/src/index';
import { DeployedLSP7DigitalAsset } from '../../../build/main/src/lib/interfaces/digital-asset-deployment';

import { lsp4DigitalAsset } from './../../../test/lsp4-digital-asset.mock';
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

  describe('lsp7 with passed lsp4Metadata', () => {
    let digitalAsset: LSP7Mintable;
    const controllerAddress = '0xaDa25A4424b08F5337DacD619D4bCb21536a9B95';
    const name = 'TOKEN';
    const symbol = 'TKN';

    it('should deploy lsp7 with metadata', async () => {
      const lspFactory = new LSPFactory(provider, signer);
      const lsp7DigitalAsset = (await lspFactory.LSP7DigitalAsset.deploy({
        controllerAddress,
        isNFT: false,
        name,
        symbol,
        digitalAssetMetadata: lsp4DigitalAsset.LSP4Metadata,
      })) as DeployedLSP7DigitalAsset;

      expect(lsp7DigitalAsset.LSP7DigitalAsset.address).toBeDefined();
      expect(Object.keys(lsp7DigitalAsset).length).toEqual(2);

      digitalAsset = LSP7Mintable__factory.connect(
        lsp7DigitalAsset.LSP7DigitalAsset.address,
        signer
      );
    });
    it('should deploy and set LSP4DigitalAsset data', async () => {
      const ownerAddress = await digitalAsset.owner();
      expect(ownerAddress).toEqual(controllerAddress);

      const data = await digitalAsset.getData([
        '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e',
      ]);

      expect(data[0].startsWith('0x6f357c6a')).toBe(true);
    });
    it('should have correct name and symbol set', async () => {
      const [retrievedName, retrievedSymbol] = await digitalAsset.getData([
        '0xdeba1e292f8ba88238e10ab3c7f88bd4be4fac56cad5194b6ecceaf653468af1',
        '0x2f0a68ab07768e01943a599e73362a0e17a63a72e94dd2e384d2c1d4db932756',
      ]);

      expect(ethers.utils.toUtf8String(retrievedName)).toEqual(name);
      expect(ethers.utils.toUtf8String(retrievedSymbol)).toEqual(symbol);
    });
  });
});
