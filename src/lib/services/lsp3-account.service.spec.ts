import ERC725 from '@erc725/erc725.js';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';

import { deployUniversalProfileContracts } from '../../../test/test.utils';
import {
  ADDRESS_PERMISSIONS_ARRAY_KEY,
  DEFAULT_PERMISSIONS,
  PREFIX_PERMISSIONS,
} from '../helpers/config.helper';

import { setData } from './lsp3-account.service';

jest.setTimeout(60000);
jest.useRealTimers();
describe('LSP3Account Service', () => {
  let signers: SignerWithAddress[];

  beforeAll(async () => {
    signers = await ethers.getSigners();
  });

  describe('setData', () => {
    let abiCoder;
    let universalProfile, universalReceiverDelegate;

    beforeAll(async () => {
      ({ universalProfile, universalReceiverDelegate } = await deployUniversalProfileContracts(
        signers[0],
        signers[0].address
      ));

      abiCoder = ethers.utils.defaultAbiCoder;
    });

    it('should set one controller address', async () => {
      const transaction = await setData(
        signers[0],
        universalProfile.address,
        universalReceiverDelegate.address,
        [signers[0].address]
      );
      expect(transaction.functionName).toEqual('setData(bytes32[],bytes[])');

      // AddressPermissions[] array length should be 1
      const [totalPermissionsSet] = await universalProfile.getData([ADDRESS_PERMISSIONS_ARRAY_KEY]);
      const expectedLength = abiCoder.encode(['uint256'], [1]);
      expect(totalPermissionsSet).toEqual(expectedLength);

      // controller address should have default permissions set
      const controllerPermissionsKey = PREFIX_PERMISSIONS + signers[0].address.substring(2);
      const [controllerPermissionsValue] = await universalProfile.getData([
        controllerPermissionsKey,
      ]);
      const expectedPermissions = ERC725.encodePermissions(DEFAULT_PERMISSIONS);
      expect(controllerPermissionsValue).toEqual(expectedPermissions);

      // controller address in the array at index 0 -> AddressPermissions[0]
      const hexIndex = ethers.utils.hexlify([0]);
      const leftSideKey = ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34);
      const rightSideKey = ethers.utils.hexZeroPad(hexIndex, 16);
      const addressPermissionArrayIndexKey = leftSideKey + rightSideKey.substring(2);

      const [result] = await universalProfile.getData([addressPermissionArrayIndexKey]);
      const checkedsumResult = ethers.utils.getAddress(result);
      expect(checkedsumResult).toEqual(signers[0].address);
    });

    it('should set 2 x controller addresses', async () => {
      const controllerAddresses = [signers[0].address, signers[0].address];

      const transaction = await setData(
        signers[0],
        universalProfile.address,
        universalReceiverDelegate.address,
        controllerAddresses
      );
      expect(transaction.functionName).toEqual('setData(bytes32[],bytes[])');

      // AddressPermissions[] array length should be 2
      const [totalPermissionsSet] = await universalProfile.getData([ADDRESS_PERMISSIONS_ARRAY_KEY]);
      const expectedLength = abiCoder.encode(['uint256'], [controllerAddresses.length]);
      expect(totalPermissionsSet).toEqual(expectedLength);

      for (let index = 0; index < controllerAddresses.length; index++) {
        const controllerAddress = controllerAddresses[index];

        // controller address should have default permissions set
        const controllerPermissionsKey = PREFIX_PERMISSIONS + controllerAddress.substring(2);
        const [controllerPermissionsValue] = await universalProfile.getData([
          controllerPermissionsKey,
        ]);
        const expectedPermissions = ERC725.encodePermissions(DEFAULT_PERMISSIONS);
        expect(controllerPermissionsValue).toEqual(expectedPermissions);

        // controller address in the array at AddressPermissions[index]
        const hexIndex = ethers.utils.hexlify([index]);
        const leftSideKey = ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34);
        const rightSideKey = ethers.utils.hexZeroPad(hexIndex, 16);
        const addressPermissionArrayIndexKey = leftSideKey + rightSideKey.substring(2);

        const [result] = await universalProfile.getData([addressPermissionArrayIndexKey]);
        const checkedsumResult = ethers.utils.getAddress(result);
        expect(checkedsumResult).toEqual(controllerAddress);
      }
    });
    it('should set 10 x controller addresses', async () => {
      const controllerAddresses = signers.slice(0, 10).map((signer) => signer.address);

      const transaction = await setData(
        signers[0],
        universalProfile.address,
        universalReceiverDelegate.address,
        controllerAddresses
      );
      expect(transaction.functionName).toEqual('setData(bytes32[],bytes[])');

      // AddressPermissions[] array length should be 10
      const [totalPermissionsSet] = await universalProfile.getData([ADDRESS_PERMISSIONS_ARRAY_KEY]);
      const expectedLength = abiCoder.encode(['uint256'], [controllerAddresses.length]);
      expect(totalPermissionsSet).toEqual(expectedLength);

      for (let index = 0; index < controllerAddresses.length; index++) {
        const controllerAddress = controllerAddresses[index];

        // controller address should have default permissions set
        const controllerPermissionsKey = PREFIX_PERMISSIONS + controllerAddress.substring(2);
        const [controllerPermissionsValue] = await universalProfile.getData([
          controllerPermissionsKey,
        ]);
        const expectedPermissions = ERC725.encodePermissions(DEFAULT_PERMISSIONS);
        expect(controllerPermissionsValue).toEqual(expectedPermissions);

        // controller address in the array at AddressPermissions[index]
        const hexIndex = ethers.utils.hexlify([index]);
        const leftSideKey = ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34);
        const rightSideKey = ethers.utils.hexZeroPad(hexIndex, 16);
        const addressPermissionArrayIndexKey = leftSideKey + rightSideKey.substring(2);

        const [result] = await universalProfile.getData([addressPermissionArrayIndexKey]);
        const checkedsumResult = ethers.utils.getAddress(result);
        expect(checkedsumResult).toEqual(controllerAddress);
      }
    });
  });
});
