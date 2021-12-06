import { LSPFactory } from '../../build/main/src/lib/lsp-factory';
import UniversalProfile from '@lukso/universalprofile-smart-contracts/artifacts/UniversalProfile.json';
import KeyManager from '@lukso/universalprofile-smart-contracts/artifacts/LSP6KeyManager.json';
import { Contract, ethers } from 'ethers';
import { ADDRESS_PERMISSIONS_ARRAY_KEY, LSP3_UP_KEYS } from '../../src/lib/helpers/config.helper';
import crypto from 'crypto';
import { testAccountAddress, testAccountDeployKey } from './constants';
import delay from 'delay';

const rpcUrl = 'https://rpc.l14.lukso.network';
const chainId = 22;

const lspFactory = new LSPFactory(rpcUrl, {
  deployKey: testAccountDeployKey,
  chainId,
});

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(testAccountDeployKey, provider);

const lsp3Profile = {
  name: 'My Profile',
  description: 'My cool Profile',
  tags: ['Fashion', 'Design'],
  links: [{ title: 'Cool', url: 'www.cool.com' }],
};

describe('Universal Profile', () => {
  let deployedContracts;
  let universalProfile: Contract;

  it('should deploy a Universal Profile', async () => {
    deployedContracts = await lspFactory.LSP3UniversalProfile.deploy({
      controllingAccounts: [testAccountAddress],
      lsp3Profile,
    });

    expect(deployedContracts).toBeDefined();
    expect(deployedContracts).toHaveProperty('ERC725Account');
    expect(deployedContracts).toHaveProperty('UniversalReceiverDelegate');
    expect(deployedContracts).toHaveProperty('KeyManager');
  });

  it('KeyManager should be the owner of the UP', async () => {
    universalProfile = new ethers.Contract(
      deployedContracts.ERC725Account.address,
      UniversalProfile.abi,
      signer
    );

    const owner = await universalProfile.owner();
    expect(deployedContracts.KeyManager.address).toEqual(owner);
  });

  it('should set lsp3 metadata', async () => {
    const lsp3Data = (await universalProfile.getData([LSP3_UP_KEYS.LSP3_PROFILE]))[0];

    expect(lsp3Data).toBeDefined();
    expect(lsp3Data.substr(2).length).toBeGreaterThan(4);
  });

  it('should set Address Permissions Array', async () => {
    const [addressPermissionsArray, controller, universalReceiverDelegate] =
      await universalProfile.getData([
        ADDRESS_PERMISSIONS_ARRAY_KEY,
        ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) + '00000000000000000000000000000000',
        ADDRESS_PERMISSIONS_ARRAY_KEY.slice(0, 34) + '00000000000000000000000000000001',
      ]);

    expect(addressPermissionsArray).toEqual('0x02');
    expect(ethers.utils.getAddress(controller)).toEqual(testAccountAddress);
    expect(ethers.utils.getAddress(universalReceiverDelegate)).toEqual(
      deployedContracts.UniversalReceiverDelegate.address
    );
  });

  it('should be able to set data', async () => {
    const key = '0xcafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe';
    const value = '0x' + crypto.randomBytes(20).toString('hex');

    const txAbi = universalProfile.interface.encodeFunctionData('setData', [[key], [value]]);

    const keyManager = new ethers.Contract(
      deployedContracts.KeyManager.address,
      KeyManager.abi,
      signer
    );

    const tx = await keyManager.execute(txAbi, { gasPrice: 20_000_000_000, from: signer.address });
    await tx.wait();

    const data = await universalProfile.getData([key]);
    expect(data[0]).toEqual(value);
  });
});
