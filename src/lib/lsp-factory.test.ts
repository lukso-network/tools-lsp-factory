import test from 'ava';
import { providers } from 'ethers';

import { getERC725 } from './helpers/erc725';
import { lsp3ProfileJson } from './helpers/sample-lsp3-profile';
import { LSPFactory } from './lsp-factory';

const provider = new providers.JsonRpcProvider('HTTP://127.0.0.1:8545');
const myLSPFactory = new LSPFactory('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', provider);

test('deploy LSP3UniversalProfile', async (t) => {
  const { erc725Account, basicKeyManager } = await myLSPFactory.createLSP3UniversalProfile({
    controllerAddresses: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
    lsp3ProfileJson,
  });

  const erc725AccountOwner = await erc725Account.owner();
  t.is(erc725AccountOwner, basicKeyManager.address);

  const erc725 = getERC725();
  const profileData = await erc725Account.getData(
    '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5'
  );
  const decodedProfileData = erc725.decodeData('LSP3Profile', profileData);
  t.is(decodedProfileData.url, 'ifps://QmbKvCVEePiDKxuouyty9bMsWBAxZDGr2jhxd4pLGLx95D');
});
