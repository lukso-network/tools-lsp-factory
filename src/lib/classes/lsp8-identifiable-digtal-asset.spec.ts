import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { providers } from 'ethers';
import { ethers } from 'hardhat';
import { Observable } from 'rxjs';

import {
  DeploymentEvent,
  LSP8Mintable,
  LSP8Mintable__factory,
  LSPFactory,
} from '../../../build/main/src/index';
import { DeployedLSP8IdentifiableDigitalAsset } from '../../../build/main/src/lib/interfaces/digital-asset-deployment';
import { lsp4DigitalAsset } from '../../../test/lsp4-digital-asset.mock';

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
    signer = (await ethers.getSigners())[0];
    proxyDeployer = new ProxyDeployer(signer);
    baseContract = await proxyDeployer.deployLSP8BaseContract();
  });

  it('should deploy LSP8 Identifiable Digital asset with no passed deployment options', async () => {
    const myLSPFactory = new LSPFactory(provider, signer);

    const lsp8IdentifiableDigitalAsset = (await myLSPFactory.LSP8IdentifiableDigitalAsset.deploy({
      controllerAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      name: 'TOKEN',
      symbol: 'TKN',
    })) as DeployedLSP8IdentifiableDigitalAsset;

    expect(lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address).toBeDefined();
    expect(Object.keys(lsp8IdentifiableDigitalAsset).length).toEqual(2);

    const LSP8IdentifiableDigitalAsset = LSP8Mintable__factory.connect(
      lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address,
      signer
    );

    const ownerAddress = await LSP8IdentifiableDigitalAsset.owner();
    expect(ownerAddress).toEqual('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  });

  it('should deploy LSP8 Identifiable Digital asset from a specified base contract', async () => {
    const myLSPFactory = new LSPFactory(provider, signer);

    const lsp8IdentifiableDigitalAsset = (await myLSPFactory.LSP8IdentifiableDigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        libAddress: baseContract.address,
      }
    )) as DeployedLSP8IdentifiableDigitalAsset;

    expect(lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address).toBeDefined();
    expect(Object.keys(lsp8IdentifiableDigitalAsset).length).toEqual(1);

    const LSP8IdentifiableDigitalAsset = LSP8Mintable__factory.connect(
      lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address,
      signer
    );

    const ownerAddress = await LSP8IdentifiableDigitalAsset.owner();
    expect(ownerAddress).toEqual(signer.address);
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
      error: (error) => {
        // Fail to exit subsciber
        expect(1).toEqual(error);
      },
      complete: async () => {
        const lsp8IdentifiableDigitalAsset = LSP8Mintable__factory.connect(lsp8Address, signer);

        const ownerAddress = await lsp8IdentifiableDigitalAsset.owner();
        expect(ownerAddress).toEqual(signer.address);
        done();
      },
    });
  });

  it('should deploy LSP8 Identifiable Digital without a base contract', async () => {
    const myLSPFactory = new LSPFactory(provider, signer);

    const lsp8IdentifiableDigitalAsset = (await myLSPFactory.LSP8IdentifiableDigitalAsset.deploy(
      {
        controllerAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        deployProxy: false,
      }
    )) as DeployedLSP8IdentifiableDigitalAsset;

    expect(lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address).toBeDefined();
    expect(Object.keys(lsp8IdentifiableDigitalAsset).length).toEqual(1);

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
        const lsp8DigitalAsset = LSP8Mintable__factory.connect(lsp8Address, signer);

        const ownerAddress = await lsp8DigitalAsset.owner();
        expect(ownerAddress).toEqual(signer.address);
        done();
      },
    });
  });

  it('should deploy lsp8 with custom bytecode', async () => {
    const lspFactory = new LSPFactory(provider, signer);

    const passedBytecode = LSP8Mintable__factory.bytecode;

    const lsp8IdentifiableDigitalAsset = (await lspFactory.LSP8IdentifiableDigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        byteCode: passedBytecode,
      }
    )) as DeployedLSP8IdentifiableDigitalAsset;

    expect(lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address).toBeDefined();
    expect(Object.keys(lsp8IdentifiableDigitalAsset).length).toEqual(1);

    const LSP8IdentifiableDigitalAsset = LSP8Mintable__factory.connect(
      lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address,
      signer
    );

    const ownerAddress = await LSP8IdentifiableDigitalAsset.owner();
    expect(ownerAddress).toEqual(signer.address);

    const mintAddress = '0x1da537A8D1979b25794FB07d694119574f4f46Cf';

    const mint = await LSP8IdentifiableDigitalAsset.mint(
      mintAddress,
      ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32),
      true,
      '0x'
    );

    expect(mint).toBeTruthy();
    await mint.wait();

    const actualMintBalance = (
      await LSP8IdentifiableDigitalAsset.balanceOf(mintAddress)
    ).toNumber();

    expect(actualMintBalance).toEqual(1);
  });

  describe('lsp8 with passed lsp4Metadata', () => {
    let digitalAsset: LSP8Mintable;
    const controllerAddress = '0xaDa25A4424b08F5337DacD619D4bCb21536a9B95';

    it('should deploy lsp8 with metadata', async () => {
      const lspFactory = new LSPFactory(provider, signer);
      const lsp8DigitalAsset = (await lspFactory.LSP8IdentifiableDigitalAsset.deploy({
        controllerAddress,
        name: 'TOKEN',
        symbol: 'TKN',
        digitalAssetMetadata: lsp4DigitalAsset.LSP4Metadata,
      })) as DeployedLSP8IdentifiableDigitalAsset;

      expect(lsp8DigitalAsset.LSP8IdentifiableDigitalAsset.address).toBeDefined();
      expect(Object.keys(lsp8DigitalAsset).length).toEqual(2);

      digitalAsset = LSP8Mintable__factory.connect(
        lsp8DigitalAsset.LSP8IdentifiableDigitalAsset.address,
        signer
      );
    });
    it('should deploy and set LSP3Profile data', async () => {
      const ownerAddress = await digitalAsset.owner();
      expect(ownerAddress).toEqual(controllerAddress);

      const data = await digitalAsset.getData([
        '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e',
      ]);

      expect(data[0].startsWith('0x6f357c6a')).toBe(true);
    });
  });
});
