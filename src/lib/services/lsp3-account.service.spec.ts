import { ERC725 } from '@erc725/erc725.js';
import UniversalProfile from '@lukso/universalprofile-smart-contracts/artifacts/UniversalProfile.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { providers } from 'ethers';
import { ethers } from 'hardhat';

import { LSPFactory } from '../../../build/main/src/lib/lsp-factory';
import {
  ADDRESS_PERMISSIONS_ARRAY_KEY,
  DEFAULT_PERMISSIONS,
  PREFIX_PERMISSIONS,
} from '../helpers/config.helper';

jest.setTimeout(60000);
jest.useRealTimers();
describe('LSP3Account Service', () => {
  let signers: SignerWithAddress[];
  let provider: providers.Web3Provider;
  let lspFactory: LSPFactory;

  beforeAll(async () => {
    provider = ethers.provider;
    signers = await ethers.getSigners();
    lspFactory = new LSPFactory(provider, signers[0]);
  });

  describe('when deploying a UP with one controller address', () => {
    let universalProfile;
    let uniqueController;

    beforeAll(async () => {
      uniqueController = signers[0].address;
      const { ERC725Account } = await lspFactory.LSP3UniversalProfile.deploy({
        controllerAddresses: [uniqueController],
      });

      universalProfile = new ethers.Contract(ERC725Account.address, UniversalProfile.abi, provider);
    });

    it('controller address should have DEFAULT_PERMISSIONS set', async () => {
      const [signerPermissions] = await universalProfile
        .connect(signers[0])
        .callStatic.getData([PREFIX_PERMISSIONS + uniqueController.substring(2)]);

      expect(signerPermissions).toEqual(ERC725.encodePermissions(DEFAULT_PERMISSIONS));
    });

    it('controller address should be registered in AddressPermissions[0] array', async () => {
      const hexIndex = ethers.utils.hexlify([0]);
      const leftSide = ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34);
      const rightSide = ethers.utils.hexZeroPad(hexIndex, 16);

      const key = leftSide + rightSide.substring(2);

      const [result] = await universalProfile.connect(signers[0]).callStatic.getData([key]);
      const checkedsumResult = ethers.utils.getAddress(result);
      expect(checkedsumResult).toEqual(uniqueController);
    });
  });

  describe('when deploying UP with 2 x controller addresses', () => {
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
