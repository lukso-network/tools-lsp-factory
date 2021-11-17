# lsp-factory.js &middot; [![GitHub license](https://img.shields.io/badge/license-Apache-blue.svg)](./LICENSE) [![npm version](https://img.shields.io/npm/v/@lukso/lsp-factory.js.svg?style=flat)](https://www.npmjs.com/package/@lukso/lsp-factory.js) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/lukso-network/tools-lsp-factory/pulls)

<p align="center">
 <h2 align="center"><strong>@lukso/lsp-factory.js</strong></h2>
 <p align="center">Helper library to allow simple deployments of <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-0-ERC725Account.md">LSP3UniversalProfiles</a> and <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-4-DigitalCertificate.md">LSP7</a> and <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-8-IdentifiableDigitalAsset.md">LSP8 </a>Digital Assets.</p>
</p>

<p align="center">For more information see <a href="https://docs.lukso.tech/tools/lsp-factoryjs/getting-started">Documentation</a>.</p>

## Install

```bash
npm install @lukso/lsp-factory.js
```

## Setup

```javascript
import { LSPFactory } from '@lukso/lsp-factory.js';

const provider = 'https://rpc.l14.lukso.network'; // RPC url used to connect to the network

const lspFactory = new LSPFactory(provider, {
  deployKey: '0x...'; // Private key of the account which will deploy UPs
  chainId: 22, // Chain Id of the network you want to connect to
});
```

## Usage

### Deploying an ERC725Account (Universal Profile)

```javascript
// Deploy LSP3 Account
const myContracts = await lspFactory.LSP3UniversalProfile.deploy({
    controllerAddresses: ['0x...'], // Address which will controll the UP
    lsp3Profile: {
      json: {
        LSP3Profile: {
          name: "My Universal Profile",
          description: "My cool Universal Profile",
          profileImage: [
            {
              width: 500,
              height: 500,
              hashFunction: "keccak256(bytes)",
              hash: "0x...", // bytes32 hex string of the image hash
              url: "ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp",
            },
          ],
          backgroundImage: [
            {
              width: 500,
              height: 500,
              hashFunction: "keccak256(bytes)",
              hash: "0x...", // bytes32 hex string of the image hash
              url: "ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp",
            },
          ],
          tags: ['Fashion', 'Design'],
          links: [{ title: "My Website", url: "www.my-website.com" }],
        },
      },
      url: "",
    },
  });
};

const myUPAddress = myContracts.erc725Account.address;
```

### Using Deployment events

The `deployReactive` method can be used to for real-time frontend updates.

```javascript
const profileDeploymentEvents = [];

const myUPAccount = await lspFactory.LSP3UniversalProfile.deployReactive({
    ...
}).subscribe({
  next: (deploymentEvent: DeploymentEvent) => {
    profileDeploymentEvents.push(deploymentEvent);
  },
  error: (error) => {
    console.error(error);
  },
  complete: () => {
    console.log(profileDeploymentEvents);
  },
});
```

## Contributing

Please check [CONTRIBUTING](./CONTRIBUTING.md).

### License

lsp-factory.js is [Apache 2.0 licensed](./LICENSE).
