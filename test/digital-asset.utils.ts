import { ethers } from 'ethers';
import { LSP7Mintable, LSP8Mintable } from '../build/main/src';
import { ERC725YDataKeys, INTERFACE_IDS } from '@lukso/lsp-smart-contracts';

export async function testDeployWithSpecifiedCreators(
  digitalAsset: LSP7Mintable | LSP8Mintable,
  creators: string[]
) {
  const [creatorArrayLength] = await digitalAsset.getData(ERC725YDataKeys.LSP4['LSP4Creators[]'].length);

  expect(creatorArrayLength).toEqual(
    '0x0000000000000000000000000000000000000000000000000000000000000003'
  );

  const [creator1, creator2, creator3] = await digitalAsset.getDataBatch([
    ERC725YDataKeys.LSP4['LSP4Creators[]'].index +
      ethers.utils.hexZeroPad(ethers.utils.hexlify([0]), 16).substring(2),
    ERC725YDataKeys.LSP4['LSP4Creators[]'].index +
      ethers.utils.hexZeroPad(ethers.utils.hexlify([1]), 16).substring(2),
    ERC725YDataKeys.LSP4['LSP4Creators[]'].index +
      ethers.utils.hexZeroPad(ethers.utils.hexlify([2]), 16).substring(2),
  ]);

  expect(ethers.utils.getAddress(creator1)).toEqual(creators[0]);
  expect(ethers.utils.getAddress(creator2)).toEqual(creators[1]);
  expect(ethers.utils.getAddress(creator3)).toEqual(creators[2]);

  const creatorKeys = creators.map((creatorAddress) => {
    return ERC725YDataKeys.LSP4.LSP4CreatorsMap + creatorAddress.slice(2);
  });

  const creatorValues = await digitalAsset.getDataBatch(creatorKeys);

  creatorValues.forEach((creatorMapValue, index) => {
    if (creators[index] === creators[2]) {
      expect(creatorMapValue).toEqual(
        INTERFACE_IDS.LSP0ERC725Account +
          ethers.utils.hexZeroPad(ethers.utils.hexlify([index]), 8).slice(2)
      );
    } else {
      expect(creatorMapValue).toEqual(
        '0xffffffff' + ethers.utils.hexZeroPad(ethers.utils.hexlify([index]), 8).slice(2)
      );
    }
  });
}
