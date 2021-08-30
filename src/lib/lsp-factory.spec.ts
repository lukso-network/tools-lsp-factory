import { ethers } from 'hardhat';

import { getERC725 } from './helpers/erc725';
import { lsp3ProfileJson } from './helpers/sample-lsp3-profile';
import { LSPFactory } from './lsp-factory';

describe('LSP3UniversalProfile', () => {
  it('should deploy and set LSP3Profile data', async () => {
    const myLSPFactory = new LSPFactory(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ethers.provider
    );

    const { erc725Account, keyManager } = await myLSPFactory.LSP3UniversalProfile.deploy({
      controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
      lsp3ProfileJson,
    });
    const erc725AccountOwner = await erc725Account.owner();
    expect(erc725AccountOwner).toEqual(keyManager.address);

    const erc725 = getERC725();
    const profileData = await erc725Account.getData(
      '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5'
    );
    const decodedProfileData = erc725.decodeData({ LSP3Profile: profileData });
    expect(decodedProfileData.LSP3Profile.url).toEqual(
      'ifps://QmbKvCVEePiDKxuouyty9bMsWBAxZDGr2jhxd4pLGLx95D'
    );
  });
});
