# lsp-factory.js &middot; [![GitHub license](https://img.shields.io/badge/license-Apache-blue.svg)](./LICENSE) [![npm version](https://img.shields.io/npm/v/@lukso/lsp-factory.js.svg?style=flat)](https://www.npmjs.com/package/@lukso/lsp-factory.js) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/lukso-network/tools-lsp-factory/pulls)

<p align="center">
 <h2 align="center"><strong>@lukso/lsp-factory.js</strong></h2>
 <p align="center">Helper library to allow simple deployments of <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-0-ERC725Account.md">UniversalProfiles</a> and <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-4-DigitalCertificate.md">LSP7</a> and <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-8-IdentifiableDigitalAsset.md">LSP8 </a>Digital Assets.</p>
</p>

<p align="center">For more information see <a href="https://docs.lukso.tech/tools/lsp-factoryjs/getting-started">Documentation</a>.</p>

## Install

```bash
npm install @lukso/lsp-factory.js
```

# Peer dependencies

| Provider | Dependency        | Version | Browser | Node |
| -------- | ----------------- | ------- | ------- | ---- |
| pinata   | @pinata/sdk       | ^2.1.0  | ✅      | ✅   |
| pinata   | cross-blob        | ^3.0.2  | ❌      | ✅   |
| pinata   | form-data         | ^4.0.0  | ❌      | ✅   |
| pinata   | form-data-encoder | ^3.0.0  | ❌      | ✅   |
| ipfs     | ipfs-http-client  | 52.0.3  | ✅      | ✅   |
| ipfs     | ipfs-utils        | 8.1.6   | ✅      | ✅   |

## Providers

Native open IPFS pinning (or local IPFS node upload)

```javascript
import { createIPFSUploader } from '@lukso/lsp-factory.js';
const uploadProvider = createIPFSUploader('https://api.2eff.lukso.dev');
```

Pinata node environment

```javascript
import { createPinataUploader } from '@lukso/lsp-factory.js';
const uploadProvider = createPinataUploader({});
```

Pinata browser environment

```javascript
import { createPinataBrowserUploader } from '@lukso/lsp-factory.js';
const uploadProvider = createPinataBrowserUploader({});
```

## Setup

```javascript
import { LSPFactory, createPrefixConverter, createIPFSUploader, addURLResolver, resolveURL } from '@lukso/lsp-factory.js';

const uploadProvider = createIPFSUploader('https://api.2eff.lukso.dev')
const provider = 'https://rpc.testnet.lukso.network'; // RPC url used to connect to the network

const lspFactory = new LSPFactory({
  provider,
  signer: '0x...'; // Private key of the account which will deploy UPs
  chainId: 4201, // Chain Id of the network you want to connect to
  uploadProvider,
});

lspFactory.addURLResolver('ipfs:', createPrefixConverter('https://2eff.lukso.dev/ipfs'))
```

## Resolve URLs for uploaded files

```javascript
// Utility to conver URLs after addURLResolver has been called.
const url = lspFactory.resolveURL(
  new URL('ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp')
);
console.log(url.toString());
```

## Implementing a custom upload provider

```javascript
const uploadProvider = async (data) => {
  // upload data to ipfs here.
  // The data can be a File (Blob) object (can have type to contain mime information)
  // An AssetBuffer object (has mimeType)
  // or a Buffer object

  // Return a URL object containing the URL. For IPFS the protocol is "ipfs:"
  // and the CID is in the hostname.
  return new URL('ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp');
};
```

## Usage

### Deploying an ERC725Account (Universal Profile)

```javascript
// Deploy LSP3 Account
const myContracts = await lspFactory.UniversalProfile.deploy({
  controllerAddresses: ['0x...'], // Address which will controll the UP
  lsp3Profile: {
    name: 'My Universal Profile',
    description: 'My cool Universal Profile',
    profileImage: [
      {
        width: 500,
        height: 500,
        hashFunction: 'keccak256(bytes)',
        hash: '0xfdafad027ecfe57eb4ad047b938805d1dec209d6e9f960fc320d7b9b11cbed14',
        url: 'ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp',
      },
    ],
    backgroundImage: [
      {
        width: 500,
        height: 500,
        hashFunction: 'keccak256(bytes)',
        hash: '0xfdafad027ecfe57eb4ad047b938805d1dec209d6e9f960fc320d7b9b11cbed14',
        url: 'ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp',
      },
    ],
    tags: ['Fashion', 'Design'],
    links: [{ title: 'My Website', url: 'www.my-website.com' }],
  },
});

const myUPAddress = myContracts.LSP0ERC725Account.address;
```

### Using Deployment events

The `onDeployEvents` option can be used to for real-time frontend updates.

```javascript
const profileDeploymentEvents = [];

const myContracts = await lspFactory.UniversalProfile.deploy(
  {
    controllerAddresses: ['0x...'], // Address which will controll the UP
  },
  {
    onDeployEvents: {
      next: (deploymentEvent: DeploymentEvent) => {
        profileDeploymentEvents.push(deploymentEvent);
      },
      error: (error) => {
        console.error(error);
      },
      complete: () => {
        console.log(profileDeploymentEvents);
      },
    },
  }
);
```

## Contributing

Please check [CONTRIBUTING](./CONTRIBUTING.md).

### License

lsp-factory.js is [Apache 2.0 licensed](./LICENSE).
