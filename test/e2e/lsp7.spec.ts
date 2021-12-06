import { LSPFactory } from '../../build/main/src/lib/lsp-factory';
import { Contract, ethers } from 'ethers';
import LSP7Mintable from '@lukso/universalprofile-smart-contracts/artifacts/LSP7Mintable.json';
import LSP8Mintable from '@lukso/universalprofile-smart-contracts/artifacts/LSP8Mintable.json';
import delay from 'delay';
import crypto from 'crypto';
import { testAccountAddress, testAccountDeployKey } from './constants';

const rpcUrl = 'https://rpc.l14.lukso.network';
const chainId = 22;

const lspFactory = new LSPFactory(rpcUrl, {
  deployKey: testAccountDeployKey,
  chainId,
});

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(testAccountDeployKey, provider);

describe('LSP7', () => {
  let deployedContracts;
  let lsp7: Contract;

  it('should deploy LSP7 contract', async () => {
    deployedContracts = await lspFactory.DigitalAsset.deployLSP7DigitalAsset({
      isNFT: true,
      ownerAddress: testAccountAddress,
      name: 'LSP7',
      symbol: 'LSP7',
    });

    expect(deployedContracts).toHaveProperty('LSP7DigitalAsset');
    expect(deployedContracts.LSP7DigitalAsset).toHaveProperty('address');
    expect(deployedContracts.LSP7DigitalAsset).toHaveProperty('receipt');
  });

  it('initializes to owner address', async () => {
    lsp7 = new ethers.Contract(
      deployedContracts.LSP7DigitalAsset.address,
      LSP7Mintable.abi,
      signer
    );

    const owner = await lsp7.owner();
    expect(owner).toEqual(testAccountAddress);
  });

  it('is mintable', async () => {
    const mintAmmount = 100;

    await lsp7.mint(testAccountAddress, mintAmmount, true, '0x', { gasPrice: 1_000_000_000 });

    await delay(10000);
    const balance = await lsp7.balanceOf(testAccountAddress);

    expect(balance.toNumber()).toEqual(mintAmmount);
  });
});
