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

    await erc725AccountProxy.setData(
      '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
      '0xbeefbeef',
      {
        from: await signer.getAddress(),
      }
    );
    const data = await erc725AccountProxy.getData(
      '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5'
    );

    expect(data).toEqual('0xbeefbeef');
  });
});
