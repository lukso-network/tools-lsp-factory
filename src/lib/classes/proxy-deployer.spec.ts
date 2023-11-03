import { hexlify, randomBytes } from 'ethers/lib/utils';
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

  it('should deploy the ERC725Account proxy and be able to set any data key/value pair', async () => {
    // LSPAccount
    const erc725AccountProxy = await proxyDeployer.deployProxyContract(
      baseContracts.universalProfile
    );
    await erc725AccountProxy.initialize(await signer.getAddress());

    const randomDataKey = hexlify(randomBytes(32));
    const randomDataValueExpected = hexlify(randomBytes(4));

    await erc725AccountProxy.setData(randomDataKey, randomDataValueExpected, {
      from: await signer.getAddress(),
    });
    expect(await erc725AccountProxy.getData(randomDataKey)).toEqual(randomDataValueExpected);
  });
});
