import { ERC725 } from '@erc725/erc725.js';
import KeyManagerContract from '@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json';
import UniversalProfileContract from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { providers } from 'ethers';
import { ethers } from 'hardhat';
import { Observable } from 'rxjs';

import {
  LSP1UniversalReceiverDelegateUP__factory,
  LSP6KeyManager__factory,
  UniversalProfile__factory,
} from '../../../build/main/src';
import { LSPFactory } from '../../../build/main/src/lib/lsp-factory';
import {
  testProxyBytecodeContainsAddress,
  testSetData,
  testUPDeployment,
} from '../../../test/test.utils';
import {
  ADDRESS_PERMISSIONS_ARRAY_KEY,
  DEFAULT_PERMISSIONS,
  LSP3_UP_KEYS,
  PREFIX_PERMISSIONS,
} from '../helpers/config.helper';
import { getDeployedByteCode } from '../helpers/deployment.helper';

import { lsp3ProfileJson } from './../../../test/lsp3-profile.mock';
import { DeployedContracts, DeploymentEvent } from './../interfaces';
import { ProxyDeployer } from './proxy-deployer';

jest.setTimeout(60000);
jest.useRealTimers();
describe('LSP3UniversalProfile', () => {
  let signers: SignerWithAddress[];
  let provider: providers.JsonRpcProvider;
  let lspFactory: LSPFactory;

  beforeAll(async () => {
    signers = await ethers.getSigners();
    provider = ethers.provider;

    lspFactory = new LSPFactory(provider, signers[0]);
  });

  describe('Deploying with LSP3Profile Metadata', () => {
    let signer: SignerWithAddress;
    let universalProfile;
    let keyManager;

    beforeAll(async () => {
      signer = signers[0];

      const { ERC725Account, KeyManager } = (await lspFactory.LSP3UniversalProfile.deploy({
        controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
        lsp3Profile: lsp3ProfileJson,
      })) as DeployedContracts;

      universalProfile = UniversalProfile__factory.connect(ERC725Account.address, signer);
      keyManager = KeyManager;
    });

    it('should deploy and set LSP3Profile data', async () => {
      const ownerAddress = await universalProfile.owner();
      expect(ownerAddress).toEqual(keyManager.address);

      const data = await universalProfile.getData([
        '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
      ]);

      expect(data[0].startsWith('0x6f357c6a')).toBe(true);
    });
  });
  describe('Deploying with LSP3Profile Metadata with specified IPFS client options', () => {
    let signer;
    let universalProfile;
    let keyManager;

    beforeAll(async () => {
      signer = signers[0];

      const { ERC725Account, KeyManager } = (await lspFactory.LSP3UniversalProfile.deploy(
        {
          controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
          lsp3Profile: lsp3ProfileJson,
        },
        {
          uploadOptions: {
            ipfsClientOptions: { host: 'ipfs.infura.io', port: 5001, protocol: 'https' },
          },
        }
      )) as DeployedContracts;

      universalProfile = UniversalProfile__factory.connect(ERC725Account.address, signer);
      keyManager = KeyManager;
    });

    it('should deploy and set LSP3Profile data', async () => {
      const ownerAddress = await universalProfile.owner();
      expect(ownerAddress).toEqual(keyManager.address);

      const data = await universalProfile.getData([
        '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
      ]);

      expect(data[0].startsWith('0x6f357c6a')).toBe(true);
    });
  });

  describe('Deploying a UP with one controller address', () => {
    let uniqueController: SignerWithAddress;
    let universalProfile;

    beforeAll(async () => {
      uniqueController = signers[0];

      const { ERC725Account } = (await lspFactory.LSP3UniversalProfile.deploy({
        controllerAddresses: [uniqueController.address],
      })) as DeployedContracts;

      universalProfile = UniversalProfile__factory.connect(ERC725Account.address, uniqueController);
    });

    it('controller address should have DEFAULT_PERMISSIONS set', async () => {
      const [signerPermissions] = await universalProfile.getData([
        PREFIX_PERMISSIONS + uniqueController.address.substring(2),
      ]);

      expect(signerPermissions).toEqual(ERC725.encodePermissions(DEFAULT_PERMISSIONS));
    });

    it('controller address should be registered in AddressPermissions[0] array', async () => {
      const hexIndex = ethers.utils.hexlify([0]);
      const key =
        ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) +
        ethers.utils.hexZeroPad(hexIndex, 16).substring(2);

      const [result] = await universalProfile.getData([key]);
      const checkedsumResult = ethers.utils.getAddress(result);
      expect(checkedsumResult).toEqual(uniqueController.address);
    });
  });

  describe('Deploying UP with 2 x controller addresses', () => {
    let universalProfile;
    let keyManager;
    let firstControllerAddress: string;
    let secondControllerAddress: string;

    beforeAll(async () => {
      firstControllerAddress = signers[0].address;
      secondControllerAddress = signers[1].address;

      const { ERC725Account, KeyManager } = (await lspFactory.LSP3UniversalProfile.deploy({
        controllerAddresses: [firstControllerAddress, secondControllerAddress],
      })) as DeployedContracts;

      universalProfile = new ethers.Contract(
        ERC725Account.address,
        UniversalProfileContract.abi,
        provider
      );

      keyManager = new ethers.Contract(KeyManager.address, KeyManagerContract.abi, provider);
    });

    it('1st address should have DEFAULT_PERMISSIONS set', async () => {
      const [signerPermissions] = await universalProfile
        .connect(signers[0])
        .callStatic.getData([PREFIX_PERMISSIONS + firstControllerAddress.substring(2)]);

      expect(signerPermissions).toEqual(ERC725.encodePermissions(DEFAULT_PERMISSIONS));
    });

    it('1st address should be registered in AddressPermissions[0] array', async () => {
      const hexIndex = ethers.utils.hexlify([0]);
      const key =
        ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) +
        ethers.utils.hexZeroPad(hexIndex, 16).substring(2);

      const [result] = await universalProfile.connect(signers[0]).callStatic.getData([key]);
      const checkedsumResult = ethers.utils.getAddress(result);
      expect(checkedsumResult).toEqual(firstControllerAddress);
    });

    it('2nd address should have DEFAULT_PERMISSIONS set', async () => {
      const [signerPermissions] = await universalProfile
        .connect(signers[1])
        .callStatic.getData([PREFIX_PERMISSIONS + secondControllerAddress.substring(2)]);

      expect(signerPermissions).toEqual(ERC725.encodePermissions(DEFAULT_PERMISSIONS));
    });

    it('2nd address should be registered in AddressPermissions[1] array', async () => {
      const hexIndex = ethers.utils.hexlify([1]);
      const key =
        ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) +
        ethers.utils.hexZeroPad(hexIndex, 16).substring(2);

      const [result] = await universalProfile.connect(signers[0]).callStatic.getData([key]);
      const checkedsumResult = ethers.utils.getAddress(result);
      expect(checkedsumResult).toEqual(secondControllerAddress);
    });
    it('All controllers should be able to setData', async () => {
      const controllers = [signers[0], signers[1]];
      for (const controller of controllers) {
        await testSetData(universalProfile.address, keyManager.address, controller);
      }
    });
  });

  describe('Reactive deployment', () => {
    it('should have correct controller address', (done) => {
      lspFactory = new LSPFactory(provider, signers[0]);

      const deployments$ = lspFactory.LSP3UniversalProfile.deploy(
        {
          controllerAddresses: [signers[0].address],
          lsp3Profile: lsp3ProfileJson,
        },
        {
          deployReactive: true,
        }
      ) as Observable<DeploymentEvent>;

      let erc725Address: string;
      let keyManagerAddress: string;

      deployments$.subscribe({
        next: (deploymentEvent: DeploymentEvent) => {
          if (
            deploymentEvent.receipt?.contractAddress &&
            deploymentEvent.contractName === 'ERC725Account'
          ) {
            erc725Address = deploymentEvent.receipt.contractAddress;
          }

          if (
            deploymentEvent.receipt?.contractAddress &&
            deploymentEvent.contractName === 'KeyManager'
          ) {
            keyManagerAddress = deploymentEvent.receipt.contractAddress;
          }
        },
        error: (error) => {
          // Fail to exit subsciber
          expect(1).toEqual(error);
        },
        complete: async () => {
          const universalProfile = UniversalProfile__factory.connect(erc725Address, signers[0]);

          const ownerAddress = await universalProfile.owner();
          expect(ownerAddress).toEqual(keyManagerAddress);

          done();
        },
      });
    });
  });

  describe('baseContract deployment flag', () => {
    describe('Deployment with all baseContract flags set to false', () => {
      it('Should not deploy base contracts', async () => {
        await testUPDeployment(
          {
            ERC725Account: { deployProxy: false },
            KeyManager: { deployProxy: false },
            UniversalReceiverDelegate: { deployProxy: false },
          },
          3,
          lspFactory,
          [signers[0].address]
        );
      });
    });

    describe('Deployment with only ERC725 baseContract set to true', () => {
      let deployedContracts: DeployedContracts;
      it('Should deploy only ERC725 Base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            ERC725Account: { deployProxy: true },
            KeyManager: { deployProxy: false },
            UniversalReceiverDelegate: { deployProxy: false },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('UP contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.ERC725Account.address,
          deployedContracts.ERC725AccountBaseContract.address,
          provider
        );
      });
    });

    describe('Deployment with only KeyManager baseContract set to true', () => {
      let deployedContracts: DeployedContracts;
      it('Should deploy only KeyManager Base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            ERC725Account: { deployProxy: false },
            KeyManager: { deployProxy: true },
            UniversalReceiverDelegate: { deployProxy: false },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('KeyManager contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.KeyManager.address,
          deployedContracts.KeyManagerBaseContract.address,
          provider
        );
      });
    });

    describe('Deployment with only URD baseContract set to true', () => {
      let deployedContracts: DeployedContracts;
      it('Should deploy only URD Base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            ERC725Account: { deployProxy: false },
            KeyManager: { deployProxy: false },
            UniversalReceiverDelegate: { deployProxy: true },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });

      it('KeyManager contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.UniversalReceiverDelegate.address,
          deployedContracts.UniversalReceiverDelegateBaseContract.address,
          provider
        );
      });
    });

    describe('Deployment with all baseContracts set to true', () => {
      it('Should deploy with all baseContracts', async () => {
        await testUPDeployment(
          {
            ERC725Account: { deployProxy: true },
            KeyManager: { deployProxy: true },
            UniversalReceiverDelegate: { deployProxy: true },
          },
          6,
          lspFactory,
          [signers[0].address]
        );
      });
    });
  });

  describe('Deploying UP with specified bytecode', () => {
    describe('Deploy ERC725Accout from custom bytecode', () => {
      let deployedContracts: DeployedContracts;
      it('should not deploy UP base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            ERC725Account: {
              byteCode: UniversalProfile__factory.bytecode,
            },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.ERC725Account.address,
          deployedContracts.KeyManager.address,
          signers[0]
        );
      });
      it('should have deployed bytecode', async () => {
        const bytecode = await getDeployedByteCode(
          deployedContracts.ERC725Account.address,
          provider
        );

        expect(bytecode).not.toEqual('0x');
        expect(bytecode.length).toBeGreaterThan(100);
      });
    });
    describe('Deploy KeyManager from custom bytecode', () => {
      let deployedContracts: DeployedContracts;
      it('should not deploy KeyManager base contract', async () => {
        lspFactory = new LSPFactory(provider, signers[1]);

        deployedContracts = await testUPDeployment(
          {
            KeyManager: { byteCode: LSP6KeyManager__factory.bytecode },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.ERC725Account.address,
          deployedContracts.KeyManager.address,
          signers[0]
        );
      });
      it('should have deployed bytecode', async () => {
        const bytecode = await getDeployedByteCode(deployedContracts.KeyManager.address, provider);

        expect(bytecode).not.toEqual('0x');
        expect(bytecode.length).toBeGreaterThan(100);
      });
    });
    describe('Deploy Universal Receiver Delegate from custom bytecode', () => {
      let deployedContracts: DeployedContracts;
      it('should not deploy KeyManager base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            UniversalReceiverDelegate: {
              byteCode: LSP1UniversalReceiverDelegateUP__factory.bytecode,
            },
          },
          5,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.ERC725Account.address,
          deployedContracts.KeyManager.address,
          signers[0]
        );
      });
      it('should have deployed bytecode', async () => {
        const bytecode = await getDeployedByteCode(
          deployedContracts.UniversalReceiverDelegate.address,
          provider
        );

        expect(bytecode).not.toEqual('0x');
        expect(bytecode.length).toBeGreaterThan(100);
      });
    });
  });

  describe('Deploying UP from specified base contracts', () => {
    let baseContracts;

    beforeAll(async () => {
      const proxyDeployer = new ProxyDeployer(signers[0]);
      baseContracts = await proxyDeployer.deployUniversalProfileBaseContracts();
    });

    describe('Deploying with only UP base contract specified', () => {
      let deployedContracts: DeployedContracts;

      it('should not deploy UP base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            ERC725Account: { libAddress: baseContracts.universalProfile.address },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.ERC725Account.address,
          deployedContracts.KeyManager.address,
          signers[0]
        );
      });
      it('UP contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.ERC725Account.address,
          baseContracts.universalProfile.address,
          provider
        );
      });
    });

    describe('Deploying with only KeyManager base contract specified', () => {
      let deployedContracts: DeployedContracts;

      it('should not deploy KeyManager base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            KeyManager: { libAddress: baseContracts.keyManager.address },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.ERC725Account.address,
          deployedContracts.KeyManager.address,
          signers[0]
        );
      });
      it('KeyManager contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.KeyManager.address,
          baseContracts.keyManager.address,
          provider
        );
      });
    });

    describe('Deploying with only UniversalReceiverDelegate contract specified', () => {
      let deployedContracts: DeployedContracts;
      it('should not deploy URD contracts', async () => {
        deployedContracts = await testUPDeployment(
          {
            UniversalReceiverDelegate: {
              libAddress: baseContracts.universalReceiverDelegate.address,
            },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.ERC725Account.address,
          deployedContracts.KeyManager.address,
          signers[0]
        );
      });
      it('should set provided LSP1 key on the UP', async () => {
        const universalProfile = UniversalProfile__factory.connect(
          deployedContracts.ERC725Account.address,
          signers[0]
        );

        const data = await universalProfile.getData([LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY]);

        const checkedsumResult = ethers.utils.getAddress(data[0]);

        expect(checkedsumResult).toEqual(baseContracts.universalReceiverDelegate.address);
      });

      it('should use provided address as base contract if deployProxy set to true', async () => {
        deployedContracts = await testUPDeployment(
          {
            UniversalReceiverDelegate: {
              libAddress: baseContracts.universalReceiverDelegate.address,
              deployProxy: true,
            },
          },
          5,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should set deployed URD contract on the UP', async () => {
        const universalProfile = UniversalProfile__factory.connect(
          deployedContracts.ERC725Account.address,
          signers[0]
        );

        const data = await universalProfile.getData([LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY]);

        const checkedsumResult = ethers.utils.getAddress(data[0]);

        expect(checkedsumResult).toEqual(deployedContracts.UniversalReceiverDelegate.address);
      });
      it('URD contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.UniversalReceiverDelegate.address,
          baseContracts.universalReceiverDelegate.address,
          provider
        );
      });
    });
  });
});
