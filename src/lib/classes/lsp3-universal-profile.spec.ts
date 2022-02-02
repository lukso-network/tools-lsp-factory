import { ERC725 } from '@erc725/erc725.js';
import UniversalProfile from '@lukso/universalprofile-smart-contracts/artifacts/UniversalProfile.json';
import { providers } from 'ethers';
import { ethers, SignerWithAddress } from 'hardhat';

import { UniversalProfile__factory } from '../../../build/main/src';
import { LSPFactory } from '../../../build/main/src/lib/lsp-factory';
import {
  ADDRESS_PERMISSIONS_ARRAY_KEY,
  DEFAULT_PERMISSIONS,
  PREFIX_PERMISSIONS,
} from '../helpers/config.helper';

import { lsp3ProfileJson } from './../../../test/lsp3-profile.mock';
import { DeploymentEvent } from './../interfaces';

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

      const { ERC725Account, KeyManager } = await lspFactory.LSP3UniversalProfile.deploy({
        controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
        lsp3Profile: lsp3ProfileJson,
      });

      universalProfile = UniversalProfile__factory.connect(ERC725Account.address, signer);
      keyManager = KeyManager;
    });

    it.skip('should deploy and set LSP3Profile data (reactive)', (done) => {
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

      const { ERC725Account } = await lspFactory.LSP3UniversalProfile.deploy({
        controllerAddresses: [uniqueController.address],
      });

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
      const leftSide = ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34);
      const rightSide = ethers.utils.hexZeroPad(hexIndex, 16);

      const key = leftSide + rightSide.substring(2);

      const [result] = await universalProfile.getData([key]);
      const checkedsumResult = ethers.utils.getAddress(result);
      expect(checkedsumResult).toEqual(uniqueController.address);
    });
  });

  describe('Deploying UP with 2 x controller addresses', () => {
    let universalProfile;
    let firstController;
    let secondController;

    beforeAll(async () => {
      firstController = signers[0].address;
      secondController = signers[1].address;

      const { ERC725Account } = await lspFactory.LSP3UniversalProfile.deploy({
        controllerAddresses: [firstController, secondController],
      });

      universalProfile = new ethers.Contract(ERC725Account.address, UniversalProfile.abi, provider);
    });

    it('1st address should have DEFAULT_PERMISSIONS set', async () => {
      const [signerPermissions] = await universalProfile
        .connect(signers[0])
        .callStatic.getData([PREFIX_PERMISSIONS + firstController.substring(2)]);

      expect(signerPermissions).toEqual(ERC725.encodePermissions(DEFAULT_PERMISSIONS));
    });

    it('1st address should be registered in AddressPermissions[0] array', async () => {
      const hexIndex = ethers.utils.hexlify([0]);
      const leftSide = ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34);
      const rightSide = ethers.utils.hexZeroPad(hexIndex, 16);

      const key = leftSide + rightSide.substring(2);

      const [result] = await universalProfile.connect(signers[0]).callStatic.getData([key]);
      const checkedsumResult = ethers.utils.getAddress(result);
      expect(checkedsumResult).toEqual(firstController);
    });

    it('2nd address should have DEFAULT_PERMISSIONS set', async () => {
      const [signerPermissions] = await universalProfile
        .connect(signers[1])
        .callStatic.getData([PREFIX_PERMISSIONS + secondController.substring(2)]);

      expect(signerPermissions).toEqual(ERC725.encodePermissions(DEFAULT_PERMISSIONS));
    });

    it('2nd address should be registered in AddressPermissions[1] array', async () => {
      const hexIndex = ethers.utils.hexlify([1]);
      const leftSide = ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34);
      const rightSide = ethers.utils.hexZeroPad(hexIndex, 16);

      const key = leftSide + rightSide.substring(2);

      const [result] = await universalProfile.connect(signers[0]).callStatic.getData([key]);
      const checkedsumResult = ethers.utils.getAddress(result);
      expect(checkedsumResult).toEqual(secondController);
    });
  });
});
