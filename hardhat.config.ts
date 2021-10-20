import '@nomiclabs/hardhat-ethers';

module.exports = {
  solidity: '0.7.3',
  networks: {
    hardhat: {
      mining: {
        auto: false,
        interval: 500,
      },
    },
  },
};
