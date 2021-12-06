import { LSPFactory } from '../../build/main/src/lib/lsp-factory';
import { Contract, ethers } from 'ethers';
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

describe('LSP8', () => {
  let deployedContracts;
  let lsp8: Contract;

  it('should deploy LSP8 contract', async () => {
    deployedContracts = await lspFactory.DigitalAsset.deployLSP8IdentifiableDigitalAsset({
      ownerAddress: testAccountAddress,
      name: 'LSP8',
      symbol: 'LSP8',
    });

    expect(deployedContracts).toHaveProperty('LSP8IdentifiableDigitalAsset');
    expect(deployedContracts.LSP8IdentifiableDigitalAsset).toHaveProperty('address');
    expect(deployedContracts.LSP8IdentifiableDigitalAsset).toHaveProperty('receipt');
  });

  it('initializes to owner address', async () => {
    lsp8 = new ethers.Contract(
      deployedContracts.LSP8IdentifiableDigitalAsset.address,
      LSP8Mintable.abi,
      signer
    );

    const owner = await lsp8.owner();
    expect(owner).toEqual(testAccountAddress);
  });

  it('is mintable', async () => {
    await lsp8.mint(testAccountAddress, '0x' + crypto.randomBytes(32).toString('hex'), true, '0x', {
      gasPrice: 1_000_000_000,
    });

    await delay(10000);
    const balance = await lsp8.balanceOf(testAccountAddress);

    expect(balance.toNumber()).toEqual(1);
  });
});
