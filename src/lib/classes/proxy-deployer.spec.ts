import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { ethers, SignerWithAddress } from 'hardhat';

import { ProxyDeployer } from './proxy-deployer';

describe('UniversalProfile', () => {
  let baseContracts;
  let proxyDeployer: ProxyDeployer;
  let signer: SignerWithAddress;

  beforeAll(async () => {
    jest.useRealTimers();

    const provider = ethers.provider;
    signer = provider.getSigner();
    proxyDeployer = new ProxyDeployer(signer);
    baseContracts = await proxyDeployer.deployUniversalProfileBaseContracts();
  });

  it('should deploy the ERC725Account proxy and setData', async () => {
    // LSPAccount
    const erc725AccountProxy = await proxyDeployer.deployProxyContract(
      baseContracts.universalProfile
    );
    await erc725AccountProxy.initialize(await signer.getAddress());

    await erc725AccountProxy.setData(ERC725YDataKeys.LSP3.LSP3Profile, '0xbeefbeef', {
      from: await signer.getAddress(),
    });
    const data = await erc725AccountProxy.getData(ERC725YDataKeys.LSP3.LSP3Profile);

    expect(data).toEqual('0xbeefbeef');
  });
});
