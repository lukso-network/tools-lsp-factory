import { ERC725 } from '@erc725/erc725.js';
import KeyManagerContract from '@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json';
import UniversalProfileContract from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { providers } from 'ethers';
import { ethers } from 'hardhat';

import {
  LSP1UniversalReceiverDelegateUP__factory,
  LSP6KeyManager__factory,
  UniversalProfile__factory,
} from '../../../build/main/src';
import { LSPFactory } from '../../../build/main/src/lib/lsp-factory';
import { lsp3ProfileJson } from '../../../test/lsp3-profile.mock';
import {
  testProxyBytecodeContainsAddress,
  testSetData,
  testUPDeployment,
} from '../../../test/test.utils';
import { UniversalProfile } from '../../../types/ethers-v5';
import {
  ADDRESS_PERMISSIONS_ARRAY_KEY,
  DEFAULT_PERMISSIONS,
  LSP3_UP_KEYS,
  PREFIX_PERMISSIONS,
} from '../helpers/config.helper';
import { getDeployedByteCode } from '../helpers/deployment.helper';
import { ContractNames, DeployedUniversalProfileContracts, DeploymentEvent } from '../interfaces';

import { ProxyDeployer } from './proxy-deployer';

jest.setTimeout(60000);
jest.useRealTimers();
describe('UniversalProfile', () => {
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
    let universalProfile: UniversalProfile;
    const expectedLSP3Value =
      '0x6f357c6a5af8bb903787236579aff8a6518c022fe655646fded5e1ea23ca7aedddb221a4697066733a2f2f516d624b76435645655069444b78756f7579747939624d73574241785a444772326a68786434704c474c78393544';

    const allowedLSP3Formats = [
      lsp3ProfileJson.LSP3Profile,
      lsp3ProfileJson,
      { json: lsp3ProfileJson, url: 'ipfs://QmbKvCVEePiDKxuouyty9bMsWBAxZDGr2jhxd4pLGLx95D' },
    ];

    allowedLSP3Formats.forEach((lsp3ProfileMetadata) => {
      describe('passing metadata to be uploaded', () => {
        it('should deploy and set LSP3Profile data', async () => {
          signer = signers[0];

          const { LSP0ERC725Account } = await lspFactory.UniversalProfile.deploy({
            controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
            lsp3Profile: lsp3ProfileMetadata,
          });

          universalProfile = UniversalProfile__factory.connect(LSP0ERC725Account.address, signer);

          const lsp3Data = await universalProfile['getData(bytes32[])']([
            '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
          ]);

          expect(lsp3Data[0].startsWith('0x6f357c6a')).toBe(true);
          expect(lsp3Data[0]).toEqual(expectedLSP3Value);
        });
      });
    });
  });

  describe('Deploying a UP with one controller address', () => {
    let uniqueController: SignerWithAddress;
    let universalProfile: UniversalProfile;

    beforeAll(async () => {
      uniqueController = signers[0];

      const { LSP0ERC725Account } = await lspFactory.UniversalProfile.deploy({
        controllerAddresses: [uniqueController.address],
      });

      universalProfile = UniversalProfile__factory.connect(
        LSP0ERC725Account.address,
        uniqueController
      );
    });

    it('controller address should have DEFAULT_PERMISSIONS set', async () => {
      const [signerPermissions] = await universalProfile['getData(bytes32[])']([
        PREFIX_PERMISSIONS + uniqueController.address.substring(2),
      ]);

      expect(signerPermissions).toEqual(ERC725.encodePermissions(DEFAULT_PERMISSIONS));
    });

    it('controller address should be registered in AddressPermissions[0] array', async () => {
      const hexIndex = ethers.utils.hexlify([0]);
      const key =
        ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) +
        ethers.utils.hexZeroPad(hexIndex, 16).substring(2);

      const [result] = await universalProfile['getData(bytes32[])']([key]);
      const checkedsumResult = ethers.utils.getAddress(result);
      expect(checkedsumResult).toEqual(uniqueController.address);
    });
  });

  describe('Deploying for a different controller address', () => {
    let controller: SignerWithAddress;
    let universalProfile: UniversalProfile;

    beforeAll(async () => {
      controller = signers[5];

      const { LSP0ERC725Account } = await lspFactory.UniversalProfile.deploy({
        controllerAddresses: [controller.address],
      });

      universalProfile = UniversalProfile__factory.connect(LSP0ERC725Account.address, controller);
    });

    it('controller address should have DEFAULT_PERMISSIONS set', async () => {
      const [signerPermissions] = await universalProfile['getData(bytes32[])']([
        PREFIX_PERMISSIONS + controller.address.substring(2),
      ]);

      expect(signerPermissions).toEqual(ERC725.encodePermissions(DEFAULT_PERMISSIONS));
    });

    it('signer address should have no permissions set', async () => {
      const [signerPermissions] = await universalProfile['getData(bytes32[])']([
        PREFIX_PERMISSIONS + signers[0].address.substring(2),
      ]);

      expect(signerPermissions).toEqual(ERC725.encodePermissions({}));
    });
  });

  describe('Deploying with custom permissions', () => {
    let controller: SignerWithAddress;
    let controllerAddress: string;
    let universalProfile: UniversalProfile;
    const customPermissions = ERC725.encodePermissions({ SETDATA: true, TRANSFERVALUE: true });

    beforeAll(async () => {
      controller = signers[0];
      controllerAddress = signers[0].address;

      const { LSP0ERC725Account } = await lspFactory.UniversalProfile.deploy({
        controllerAddresses: [{ address: controllerAddress, permissions: customPermissions }],
      });

      universalProfile = UniversalProfile__factory.connect(LSP0ERC725Account.address, controller);
    });

    it('controller address should have custom permissions set', async () => {
      const [signerPermissions] = await universalProfile['getData(bytes32[])']([
        PREFIX_PERMISSIONS + controller.address.substring(2),
      ]);

      expect(signerPermissions).toEqual(customPermissions);
    });
  });

  describe('Deploying UP with 2 x controller addresses', () => {
    let universalProfile: UniversalProfile;
    let keyManager;
    let firstControllerAddress: string;
    let secondControllerAddress: string;
    const customPermissions = ERC725.encodePermissions({
      DELEGATECALL: true,
      CALL: true,
      SETDATA: true,
    });

    beforeAll(async () => {
      firstControllerAddress = signers[0].address;
      secondControllerAddress = signers[1].address;

      const { LSP0ERC725Account, LSP6KeyManager } = await lspFactory.UniversalProfile.deploy({
        controllerAddresses: [
          firstControllerAddress,
          { address: secondControllerAddress, permissions: customPermissions },
        ],
      });

      universalProfile = new ethers.Contract(
        LSP0ERC725Account.address,
        UniversalProfileContract.abi,
        provider
      );

      keyManager = new ethers.Contract(LSP6KeyManager.address, KeyManagerContract.abi, provider);
    });

    it('1st address should have DEFAULT_PERMISSIONS set', async () => {
      const [signerPermissions] = await universalProfile
        .connect(signers[0])
        .callStatic['getData(bytes32[])']([
          PREFIX_PERMISSIONS + firstControllerAddress.substring(2),
        ]);

      expect(signerPermissions).toEqual(ERC725.encodePermissions(DEFAULT_PERMISSIONS));
    });

    it('1st address should be registered in AddressPermissions[0] array', async () => {
      const hexIndex = ethers.utils.hexlify([0]);
      const key =
        ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) +
        ethers.utils.hexZeroPad(hexIndex, 16).substring(2);

      const [result] = await universalProfile
        .connect(signers[0])
        .callStatic['getData(bytes32[])']([key]);
      const checkedsumResult = ethers.utils.getAddress(result);
      expect(checkedsumResult).toEqual(firstControllerAddress);
    });

    it('2nd address should have DEFAULT_PERMISSIONS set', async () => {
      const [signerPermissions] = await universalProfile
        .connect(signers[1])
        .callStatic['getData(bytes32[])']([
          PREFIX_PERMISSIONS + secondControllerAddress.substring(2),
        ]);

      expect(signerPermissions).toEqual(customPermissions);
    });

    it('2nd address should be registered in AddressPermissions[1] array', async () => {
      const hexIndex = ethers.utils.hexlify([1]);
      const key =
        ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) +
        ethers.utils.hexZeroPad(hexIndex, 16).substring(2);

      const [result] = await universalProfile
        .connect(signers[0])
        .callStatic['getData(bytes32[])']([key]);
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

  describe('Async deployment', () => {
    it('should have correct controller address', (done) => {
      lspFactory = new LSPFactory(provider, signers[0]);

      let erc725Address: string;
      let keyManagerAddress: string;

      lspFactory.UniversalProfile.deploy(
        {
          controllerAddresses: [signers[0].address],
          lsp3Profile: lsp3ProfileJson.LSP3Profile,
        },
        {
          onDeployEvents: {
            next: (deploymentEvent: DeploymentEvent) => {
              if (
                deploymentEvent.receipt?.contractAddress &&
                deploymentEvent.contractName === ContractNames.ERC725_Account
              ) {
                erc725Address = deploymentEvent.receipt.contractAddress;
              }

              if (
                deploymentEvent.receipt?.contractAddress &&
                deploymentEvent.contractName === ContractNames.KEY_MANAGER
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
          },
        }
      );
    });
  });

  describe('baseContract deployment flag', () => {
    describe('Deployment with all baseContract flags set to false', () => {
      it('Should not deploy base contracts', async () => {
        await testUPDeployment(
          {
            LSP0ERC725Account: { deployProxy: false },
            LSP6KeyManager: { deployProxy: false },
            LSP1UniversalReceiverDelegate: { deployProxy: false },
          },
          3,
          lspFactory,
          [signers[0].address]
        );
      });
    });

    describe('Deployment with only ERC725 baseContract set to true', () => {
      let deployedContracts: DeployedUniversalProfileContracts;
      it('Should deploy only ERC725 Base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            LSP0ERC725Account: { deployProxy: true },
            LSP6KeyManager: { deployProxy: false },
            LSP1UniversalReceiverDelegate: { deployProxy: false },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('UP contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.LSP0ERC725Account.address,
          deployedContracts.LSP0ERC725AccountBaseContract.address,
          provider
        );
      });
    });

    describe('Deployment with only KeyManager baseContract set to true', () => {
      let deployedContracts: DeployedUniversalProfileContracts;
      it('Should deploy only KeyManager Base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            LSP0ERC725Account: { deployProxy: false },
            LSP6KeyManager: { deployProxy: true },
            LSP1UniversalReceiverDelegate: { deployProxy: false },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('KeyManager contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.LSP6KeyManager.address,
          deployedContracts.LSP6KeyManagerBaseContract.address,
          provider
        );
      });
    });

    describe('Deployment with only URD baseContract set to true', () => {
      let deployedContracts: DeployedUniversalProfileContracts;
      it('Should deploy only URD Base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            LSP0ERC725Account: { deployProxy: false },
            LSP6KeyManager: { deployProxy: false },
            LSP1UniversalReceiverDelegate: { deployProxy: true },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });

      it('KeyManager contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.LSP1UniversalReceiverDelegate.address,
          deployedContracts.LSP1UniversalReceiverDelegateBaseContract.address,
          provider
        );
      });
    });

    describe('Deployment with all baseContracts set to true', () => {
      it('Should deploy with all baseContracts', async () => {
        await testUPDeployment(
          {
            LSP0ERC725Account: { deployProxy: true },
            LSP6KeyManager: { deployProxy: true },
            LSP1UniversalReceiverDelegate: { deployProxy: true },
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
      let deployedContracts: DeployedUniversalProfileContracts;
      it('should not deploy UP base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            LSP0ERC725Account: {
              version: UniversalProfile__factory.bytecode,
            },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.LSP0ERC725Account.address,
          deployedContracts.LSP6KeyManager.address,
          signers[0]
        );
      });
      it('should have deployed bytecode', async () => {
        const bytecode = await getDeployedByteCode(
          deployedContracts.LSP0ERC725Account.address,
          provider
        );

        expect(bytecode).not.toEqual('0x');
        expect(bytecode.length).toBeGreaterThan(100);
      });
    });
    describe('Deploy KeyManager from custom bytecode', () => {
      let deployedContracts: DeployedUniversalProfileContracts;
      it('should not deploy KeyManager base contract', async () => {
        lspFactory = new LSPFactory(provider, signers[1]);

        deployedContracts = await testUPDeployment(
          {
            LSP6KeyManager: { version: LSP6KeyManager__factory.bytecode },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.LSP0ERC725Account.address,
          deployedContracts.LSP6KeyManager.address,
          signers[0]
        );
      });
      it('should have deployed bytecode', async () => {
        const bytecode = await getDeployedByteCode(
          deployedContracts.LSP6KeyManager.address,
          provider
        );

        expect(bytecode).not.toEqual('0x');
        expect(bytecode.length).toBeGreaterThan(100);
      });
    });
    describe('Deploy Universal Receiver Delegate from custom bytecode', () => {
      let deployedContracts: DeployedUniversalProfileContracts;
      it('should not deploy KeyManager base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            LSP1UniversalReceiverDelegate: {
              version: LSP1UniversalReceiverDelegateUP__factory.bytecode,
            },
          },
          5,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.LSP0ERC725Account.address,
          deployedContracts.LSP6KeyManager.address,
          signers[0]
        );
      });
      it('should have deployed bytecode', async () => {
        const bytecode = await getDeployedByteCode(
          deployedContracts.LSP1UniversalReceiverDelegate.address,
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
      let deployedContracts: DeployedUniversalProfileContracts;

      it('should not deploy UP base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            LSP0ERC725Account: { version: baseContracts.universalProfile.address },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.LSP0ERC725Account.address,
          deployedContracts.LSP6KeyManager.address,
          signers[0]
        );
      });
      it('UP contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.LSP0ERC725Account.address,
          baseContracts.universalProfile.address,
          provider
        );
      });
    });

    describe('Deploying with only KeyManager base contract specified', () => {
      let deployedContracts: DeployedUniversalProfileContracts;

      it('should not deploy KeyManager base contract', async () => {
        deployedContracts = await testUPDeployment(
          {
            LSP6KeyManager: { version: baseContracts.keyManager.address },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.LSP0ERC725Account.address,
          deployedContracts.LSP6KeyManager.address,
          signers[0]
        );
      });
      it('KeyManager contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.LSP6KeyManager.address,
          baseContracts.keyManager.address,
          provider
        );
      });
    });

    describe('Deploying with only UniversalReceiverDelegate contract specified', () => {
      let deployedContracts: DeployedUniversalProfileContracts;
      it('should not deploy URD contracts', async () => {
        deployedContracts = await testUPDeployment(
          {
            LSP1UniversalReceiverDelegate: {
              version: baseContracts.universalReceiverDelegate.address,
            },
          },
          4,
          lspFactory,
          [signers[0].address]
        );
      });
      it('should be able to setData', async () => {
        await testSetData(
          deployedContracts.LSP0ERC725Account.address,
          deployedContracts.LSP6KeyManager.address,
          signers[0]
        );
      });
      it('should set provided LSP1 key on the UP', async () => {
        const universalProfile = UniversalProfile__factory.connect(
          deployedContracts.LSP0ERC725Account.address,
          signers[0]
        );

        const data = await universalProfile['getData(bytes32[])']([
          LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY,
        ]);

        const checkedsumResult = ethers.utils.getAddress(data[0]);

        expect(checkedsumResult).toEqual(baseContracts.universalReceiverDelegate.address);
      });

      it('should use provided address as base contract if deployProxy set to true', async () => {
        deployedContracts = await testUPDeployment(
          {
            LSP1UniversalReceiverDelegate: {
              version: baseContracts.universalReceiverDelegate.address,
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
          deployedContracts.LSP0ERC725Account.address,
          signers[0]
        );

        const univeralReceiverDelegate = await universalProfile['getData(bytes32[])']([
          LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY,
        ]);

        const checkedsumResult = ethers.utils.getAddress(univeralReceiverDelegate[0]);

        expect(checkedsumResult).toEqual(deployedContracts.LSP1UniversalReceiverDelegate.address);
      });
      it('URD contract bytecode should contain base contract address', async () => {
        await testProxyBytecodeContainsAddress(
          deployedContracts.LSP1UniversalReceiverDelegate.address,
          baseContracts.universalReceiverDelegate.address,
          provider
        );
      });
    });
  });
});
