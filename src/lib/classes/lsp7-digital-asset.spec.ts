import { SUPPORTED_VERIFICATION_FUNCTION_HASHES } from '@erc725/erc725.js/build/main/src/constants/constants';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { providers } from 'ethers';
import { ethers } from 'hardhat';

import {
  DeploymentEvent,
  LSP7Mintable,
  LSP7Mintable__factory,
  LSPFactory,
} from '../../../build/main/src/index';
import { testDeployWithSpecifiedCreators } from '../../../test/digital-asset.utils';
import { lsp4DigitalAsset } from '../../../test/lsp4-digital-asset.mock';

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
        LSP7DigitalAsset: {
          version: baseContract.address,
        },
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
        LSP7DigitalAsset: {
          deployProxy: false,
        },
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

  it('should deploy async', (done) => {
    const myLSPFactory = new LSPFactory(provider, signer);

    let lsp7Address: string;

    myLSPFactory.LSP7DigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        isNFT: false,
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        onDeployEvents: {
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
        },
        LSP7DigitalAsset: { deployProxy: true },
      }
    );
  });

  it('should deploy lsp7 with custom bytecode', async () => {
    const lspFactory = new LSPFactory(provider, signer);

    const passedBytecode = LSP7Mintable__factory.bytecode;

    const lsp7DigitalAsset = await lspFactory.LSP7DigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        isNFT: false,
        name: 'TOKEN',
        symbol: 'TKN',
      },
      {
        LSP7DigitalAsset: {
          version: passedBytecode,
        },
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
    const expectedLSP4Value =
      '0x6f357c6a4d81f92a409b60c056e13102169c07e03f7de2dbcb79775a8b1f66a55b6278a0697066733a2f2f516d61543479786a45464e6d7163595965547832706e5a46426d71395055737763424c446b394b716f7148504b67';

    const allowedLSP4Formats = [
      lsp4DigitalAsset.LSP4Metadata,
      lsp4DigitalAsset,
      { json: lsp4DigitalAsset, url: 'ipfs://QmaT4yxjEFNmqcYYeTx2pnZFBmq9PUswcBLDk9KqoqHPKg' },
    ];

    allowedLSP4Formats.forEach((lsp4Metadata) => {
      it('should deploy lsp7 with metadata', async () => {
        const lspFactory = new LSPFactory(provider, signer);
        const lsp7DigitalAsset = await lspFactory.LSP7DigitalAsset.deploy({
          controllerAddress,
          isNFT: false,
          name,
          symbol,
          digitalAssetMetadata: lsp4Metadata,
        });

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

        const data = await digitalAsset.getData(ERC725YDataKeys.LSP4.LSP4Metadata);

        expect(data.startsWith(SUPPORTED_VERIFICATION_FUNCTION_HASHES.HASH_KECCAK256_UTF8)).toBe(
          true
        );
        expect(data).toEqual(expectedLSP4Value);
      });
      it('should have correct name and symbol set', async () => {
        const [retrievedName, retrievedSymbol] = await digitalAsset.getDataBatch([
          '0xdeba1e292f8ba88238e10ab3c7f88bd4be4fac56cad5194b6ecceaf653468af1',
          '0x2f0a68ab07768e01943a599e73362a0e17a63a72e94dd2e384d2c1d4db932756',
        ]);

        expect(ethers.utils.toUtf8String(retrievedName)).toEqual(name);
        expect(ethers.utils.toUtf8String(retrievedSymbol)).toEqual(symbol);
      });
    });
  });

  describe('deploy lsp7 with specified creators', () => {
    let digitalAsset: LSP7Mintable;
    const controllerAddress = '0xaDa25A4424b08F5337DacD619D4bCb21536a9B95';
    const name = 'TOKEN';
    const symbol = 'TKN';
    const isNFT = true;
    const creators = [
      '0xFCA72D5763b8cFc686C2285099D5F35a2F094E9f',
      '0x591c236982b089Ad4B60758C075fA50Ec53CD674',
    ];
    let lspFactory: LSPFactory;

    beforeAll(async () => {
      lspFactory = new LSPFactory(provider, signer);
      const contracts = await lspFactory.UniversalProfile.deploy({
        controllerAddresses: [controllerAddress],
      });

      const universalProfileAddress = contracts.LSP0ERC725Account.address;
      creators.push(universalProfileAddress);
    });

    it('should deploy with specified creators', async () => {
      const lsp7DigitalAsset = await lspFactory.LSP7DigitalAsset.deploy({
        controllerAddress,
        name,
        symbol,
        creators,
        isNFT,
      });

      digitalAsset = LSP7Mintable__factory.connect(
        lsp7DigitalAsset.LSP7DigitalAsset.address,
        signer
      );

      expect(lsp7DigitalAsset.LSP7DigitalAsset.address).toBeDefined();
      expect(Object.keys(lsp7DigitalAsset).length).toEqual(2);
    });

    it('should have LSP4Creators[] set correctly', async () => {
      await testDeployWithSpecifiedCreators(digitalAsset, creators);
    });
  });
});
