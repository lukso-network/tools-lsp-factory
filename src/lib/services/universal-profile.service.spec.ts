import ERC725 from '@erc725/erc725.js';
import { ALL_PERMISSIONS, ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';

import { deployUniversalProfileContracts } from '../../../test/test.utils';

import { prepareSetDataParameters } from './universal-profile.service';

jest.setTimeout(60000);
jest.useRealTimers();
describe('LSP3Account Service', () => {
  let signers: SignerWithAddress[];

  beforeAll(async () => {
    signers = await ethers.getSigners();
  });

  describe('prepareSetDataParameters', () => {
    let universalProfile, universalReceiverDelegate;

    beforeAll(async () => {
      ({ universalProfile, universalReceiverDelegate } = await deployUniversalProfileContracts(
        signers[0],
        signers[0].address
      ));

      abiCoder = ethers.utils.defaultAbiCoder;
    });

    it('should set one controller address', async () => {
      const { keysToSet, valuesToSet, erc725AccountAddress } = await prepareSetDataParameters(
        signers[0],
        universalProfile.address,
        universalReceiverDelegate.address,
        [signers[0].address]
      );

      expect(universalProfile.address).toEqual(erc725AccountAddress);

      // AddressPermissions[] array length should be 1
      const totalPermissionsSet =
        valuesToSet[keysToSet.indexOf(ERC725YDataKeys.LSP6['AddressPermissions[]'].length)];
      const expectedLength = ethers.utils.hexZeroPad(2, 16);
      expect(totalPermissionsSet).toEqual(expectedLength);

      // controller address should have default permissions set
      const controllerPermissionsKey =
        ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + signers[0].address.substring(2);
      const controllerPermissionsValue = valuesToSet[keysToSet.indexOf(controllerPermissionsKey)];
      const expectedPermissions = ERC725.encodePermissions({
        CHANGEOWNER: true,
        EDITPERMISSIONS: true,
      });
      expect(controllerPermissionsValue).toEqual(expectedPermissions);

      // controller address in the array at index 0 -> AddressPermissions[0]
      const hexIndex = ethers.utils.hexlify([0]);

      const addressPermissionArrayIndexKey =
        ERC725YDataKeys.LSP6['AddressPermissions[]'].index +
        ethers.utils.hexZeroPad(hexIndex, 16).substring(2);

      const result = valuesToSet[keysToSet.indexOf(addressPermissionArrayIndexKey)];
      const checkedsumResult = ethers.utils.getAddress(result);
      expect(checkedsumResult).toEqual(signers[0].address);
    });

    it('should set 2 x controller addresses', async () => {
      const controllerAddresses = [signers[0].address, signers[0].address];

      const { keysToSet, valuesToSet } = await prepareSetDataParameters(
        signers[0],
        universalProfile.address,
        universalReceiverDelegate.address,
        controllerAddresses
      );

      // AddressPermissions[] array length should be 2
      const totalPermissionsSet =
        valuesToSet[keysToSet.indexOf(ERC725YDataKeys.LSP6['AddressPermissions[]'].length)];
      const expectedLength = ethers.utils.hexZeroPad(controllerAddresses.length + 1, 16);
      expect(totalPermissionsSet).toEqual(expectedLength);

      for (let index = 0; index < controllerAddresses.length; index++) {
        const controllerAddress = controllerAddresses[index];

        // controller address should have default permissions set
        const controllerPermissionsKey =
          ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + controllerAddress.substring(2);
        const controllerPermissionsValue = valuesToSet[keysToSet.indexOf(controllerPermissionsKey)];

        const expectedPermissions = ERC725.encodePermissions({
          CHANGEOWNER: true,
          EDITPERMISSIONS: true,
        });
        expect(controllerPermissionsValue).toEqual(expectedPermissions);

        // controller address in the array at AddressPermissions[index]
        const hexIndex = ethers.utils.hexlify([index]);
        const leftSideKey = ERC725YDataKeys.LSP6['AddressPermissions[]'].index;
        const rightSideKey = ethers.utils.hexZeroPad(hexIndex, 16);
        const addressPermissionArrayIndexKey = leftSideKey + rightSideKey.substring(2);

        const result = valuesToSet[keysToSet.indexOf(addressPermissionArrayIndexKey)];
        const checkedsumResult = ethers.utils.getAddress(result);
        expect(checkedsumResult).toEqual(controllerAddress);
      }
    });
    it('should set 10 x controller addresses', async () => {
      const controllerAddresses = signers.slice(0, 10).map((signer) => signer.address);

      const { keysToSet, valuesToSet } = await prepareSetDataParameters(
        signers[0],
        universalProfile.address,
        universalReceiverDelegate.address,
        controllerAddresses
      );

      // AddressPermissions[] array length should be 11 (including Universal Receiver Delegate address)
      const totalPermissionsSet =
        valuesToSet[keysToSet.indexOf(ERC725YDataKeys.LSP6['AddressPermissions[]'].length)];
      const expectedLength = ethers.utils.hexZeroPad(controllerAddresses.length + 1, 16);
      expect(totalPermissionsSet).toEqual(expectedLength);

      for (let index = 0; index < controllerAddresses.length; index++) {
        const controllerAddress = controllerAddresses[index];

        // controller address should have default permissions set
        const controllerPermissionsKey =
          ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + controllerAddress.substring(2);
        const controllerPermissionsValue = valuesToSet[keysToSet.indexOf(controllerPermissionsKey)];

        const expectedPermissions =
          controllerAddress === (await signers[0].getAddress())
            ? ERC725.encodePermissions({
                CHANGEOWNER: true,
                EDITPERMISSIONS: true,
              })
            : ALL_PERMISSIONS;

        expect(controllerPermissionsValue).toEqual(expectedPermissions);

        // controller address in the array at AddressPermissions[index]
        const hexIndex = ethers.utils.hexlify([index]);
        const leftSideKey = ERC725YDataKeys.LSP6['AddressPermissions[]'].index;
        const rightSideKey = ethers.utils.hexZeroPad(hexIndex, 16);
        const addressPermissionArrayIndexKey = leftSideKey + rightSideKey.substring(2);

        const result = valuesToSet[keysToSet.indexOf(addressPermissionArrayIndexKey)];
        const checkedsumResult = ethers.utils.getAddress(result);
        expect(checkedsumResult).toEqual(controllerAddress);
      }
    });
  });
});
