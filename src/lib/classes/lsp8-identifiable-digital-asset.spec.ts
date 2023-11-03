import { SUPPORTED_VERIFICATION_FUNCTION_HASHES } from '@erc725/erc725.js/build/main/src/constants/constants';
import { ERC725YDataKeys, LSP8_TOKEN_ID_TYPES } from '@lukso/lsp-smart-contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { providers } from 'ethers';
import { ethers } from 'hardhat';
import { Subject } from 'rxjs';

import {
  DeploymentEvent,
  LSP8Mintable,
  LSP8Mintable__factory,
  LSPFactory,
} from '../../../build/main/src/index';
import { testDeployWithSpecifiedCreators } from '../../../test/digital-asset.utils';
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

    const lsp8IdentifiableDigitalAsset = await myLSPFactory.LSP8IdentifiableDigitalAsset.deploy({
      controllerAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      name: 'TOKEN',
      symbol: 'TKN',
      tokenIdType: LSP8_TOKEN_ID_TYPES.UNIQUE_ID,
    });

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

    const lsp8IdentifiableDigitalAsset = await myLSPFactory.LSP8IdentifiableDigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        name: 'TOKEN',
        symbol: 'TKN',
        tokenIdType: LSP8_TOKEN_ID_TYPES.UNIQUE_ID,
      },
      {
        LSP8IdentifiableDigitalAsset: {
          version: baseContract.address,
        },
      }
    );

    expect(lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address).toBeDefined();
    expect(Object.keys(lsp8IdentifiableDigitalAsset).length).toEqual(1);

    const LSP8IdentifiableDigitalAsset = LSP8Mintable__factory.connect(
      lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address,
      signer
    );

    const ownerAddress = await LSP8IdentifiableDigitalAsset.owner();
    expect(ownerAddress).toEqual(signer.address);
  });

  it('should deploy async', (done) => {
    const myLSPFactory = new LSPFactory(provider, signer);
    let lsp8Address: string;

    myLSPFactory.LSP8IdentifiableDigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        name: 'TOKEN',
        symbol: 'TKN',
        tokenIdType: LSP8_TOKEN_ID_TYPES.UNIQUE_ID,
      },
      {
        LSP8IdentifiableDigitalAsset: { version: baseContract.address },
        onDeployEvents: {
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
        },
      }
    );
  });

  it('Should be compatible with RxJS', (done) => {
    const myLSPFactory = new LSPFactory(provider, signer);
    let lsp8Address: string;

    const subject = new Subject<DeploymentEvent>();
    const lsp7DigitalAsset$ = subject.asObservable();

    const next = (deploymentEvent: DeploymentEvent) => {
      subject.next(deploymentEvent);
    };

    const complete = () => {
      subject.complete();
    };

    lsp7DigitalAsset$.subscribe({
      next: (deploymentEvent: DeploymentEvent) => {
        if (
          deploymentEvent.receipt?.contractAddress &&
          deploymentEvent.contractName === 'LSP8IdentifiableDigitalAsset'
        ) {
          lsp8Address = deploymentEvent.receipt.contractAddress;
        }
      },
      complete: async () => {
        const lsp8IdentifiableDigitalAsset = LSP8Mintable__factory.connect(lsp8Address, signer);

        const ownerAddress = await lsp8IdentifiableDigitalAsset.owner();
        expect(ownerAddress).toEqual(signer.address);
        done();
      },
      error: (error) => {
        // Fail to exit subsciber
        expect(1).toEqual(error);
      },
    });

    myLSPFactory.LSP8IdentifiableDigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        name: 'TOKEN',
        symbol: 'TKN',
        tokenIdType: LSP8_TOKEN_ID_TYPES.UNIQUE_ID,
      },
      {
        LSP8IdentifiableDigitalAsset: { version: baseContract.address },
        onDeployEvents: {
          next,
          complete,
        },
      }
    );
  });

  it('should deploy LSP8 Identifiable Digital without a base contract', async () => {
    const myLSPFactory = new LSPFactory(provider, signer);

    const lsp8IdentifiableDigitalAsset = await myLSPFactory.LSP8IdentifiableDigitalAsset.deploy(
      {
        controllerAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        name: 'TOKEN',
        symbol: 'TKN',
        tokenIdType: LSP8_TOKEN_ID_TYPES.UNIQUE_ID,
      },
      {
        LSP8IdentifiableDigitalAsset: {
          deployProxy: false,
        },
      }
    );

    expect(lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address).toBeDefined();
    expect(Object.keys(lsp8IdentifiableDigitalAsset).length).toEqual(1);

    const LSP8IdentifiableDigitalAsset = LSP8Mintable__factory.connect(
      lsp8IdentifiableDigitalAsset.LSP8IdentifiableDigitalAsset.address,
      signer
    );

    const ownerAddress = await LSP8IdentifiableDigitalAsset.owner();
    expect(ownerAddress).toEqual('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  });

  it('should deploy lsp8 with custom bytecode', async () => {
    const lspFactory = new LSPFactory(provider, signer);

    const passedBytecode = LSP8Mintable__factory.bytecode;

    const lsp8IdentifiableDigitalAsset = await lspFactory.LSP8IdentifiableDigitalAsset.deploy(
      {
        controllerAddress: signer.address,
        name: 'TOKEN',
        symbol: 'TKN',
        tokenIdType: LSP8_TOKEN_ID_TYPES.UNIQUE_ID,
      },
      {
        LSP8IdentifiableDigitalAsset: {
          version: passedBytecode,
        },
      }
    );

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

  fdescribe('lsp8 with passed lsp4Metadata', () => {
    let digitalAsset: LSP8Mintable;
    const controllerAddress = '0xaDa25A4424b08F5337DacD619D4bCb21536a9B95';
    const name = 'TOKEN';
    const symbol = 'TKN';
    const tokenIdType = LSP8_TOKEN_ID_TYPES.UNIQUE_ID;

    const expectedLSP4Value =
      '0x6f357c6a4d81f92a409b60c056e13102169c07e03f7de2dbcb79775a8b1f66a55b6278a0697066733a2f2f516d61543479786a45464e6d7163595965547832706e5a46426d71395055737763424c446b394b716f7148504b67';

    const allowedLSP4Formats = [
      lsp4DigitalAsset.LSP4Metadata,
      lsp4DigitalAsset,
      { json: lsp4DigitalAsset, url: 'ipfs://QmaT4yxjEFNmqcYYeTx2pnZFBmq9PUswcBLDk9KqoqHPKg' },
    ];

    allowedLSP4Formats.forEach((lsp4Metadata) => {
      it('should deploy lsp8 with metadata', async () => {
        const lspFactory = new LSPFactory(provider, signer);
        const lsp8DigitalAsset = await lspFactory.LSP8IdentifiableDigitalAsset.deploy({
          controllerAddress,
          name,
          symbol,
          digitalAssetMetadata: lsp4Metadata,
          tokenIdType,
        });

        expect(lsp8DigitalAsset.LSP8IdentifiableDigitalAsset.address).toBeDefined();
        expect(Object.keys(lsp8DigitalAsset).length).toEqual(2);

        digitalAsset = LSP8Mintable__factory.connect(
          lsp8DigitalAsset.LSP8IdentifiableDigitalAsset.address,
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

      it('should have correct name, symbol and token ID type set', async () => {
        const [retrievedName, retrievedSymbol, retrievedTokenIdType] =
          await digitalAsset.getDataBatch([
            ERC725YDataKeys.LSP4.LSP4TokenName,
            ERC725YDataKeys.LSP4.LSP4TokenSymbol,
            ERC725YDataKeys.LSP8.LSP8TokenIdType,
          ]);

        const tokenIdTypeDecoded = ethers.BigNumber.from(retrievedTokenIdType).toNumber();

        expect(ethers.utils.toUtf8String(retrievedName)).toEqual(name);
        expect(ethers.utils.toUtf8String(retrievedSymbol)).toEqual(symbol);
        expect(tokenIdTypeDecoded).toEqual(tokenIdType);
      });
    });

    describe('deploy lsp8 with specified creators', () => {
      let digitalAsset: LSP8Mintable;
      const controllerAddress = '0xaDa25A4424b08F5337DacD619D4bCb21536a9B95';
      const name = 'TOKEN';
      const symbol = 'TKN';
      const creators = [
        '0xFCA72D5763b8cFc686C2285099D5F35a2F094E9f',
        '0x591c236982b089Ad4B60758C075fA50Ec53CD674',
      ];
      const tokenIdType = LSP8_TOKEN_ID_TYPES.UNIQUE_ID;

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
        const lsp8DigitalAsset = await lspFactory.LSP8IdentifiableDigitalAsset.deploy({
          controllerAddress,
          name,
          symbol,
          creators,
          tokenIdType,
        });

        digitalAsset = LSP8Mintable__factory.connect(
          lsp8DigitalAsset.LSP8IdentifiableDigitalAsset.address,
          signer
        );

        expect(lsp8DigitalAsset.LSP8IdentifiableDigitalAsset.address).toBeDefined();
        expect(Object.keys(lsp8DigitalAsset).length).toEqual(2);
      });

      it('should have LSP4Creators[] set correctly', async () => {
        await testDeployWithSpecifiedCreators(digitalAsset, creators);
      });
    });
  });
});
