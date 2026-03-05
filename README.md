<p align="center">
 <h1 align="center"><strong>@lukso/lsp-factory.js</strong></h1>
 <p align="center">Helper library to allow simple deployments of <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-0-ERC725Account.md">Universal Profiles</a>, <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-7-DigitalAsset.md">LSP7 Digital Assets</a>, and <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-8-IdentifiableDigitalAsset.md">LSP8 Identifiable Digital Assets</a> on LUKSO.</p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lukso/lsp-factory.js">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@lukso/lsp-factory.js.svg?style=flat" />
  </a>
  <a href="https://github.com/lukso-network/tools-lsp-factory/actions">
    <img alt="Tests Passing" src="https://github.com/lukso-network/tools-lsp-factory/actions/workflows/lint-build-test.yml/badge.svg" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/lukso-network/tools-lsp-factory/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  </a>
  <a href="https://github.com/lukso-network/tools-lsp-factory/issues">
    <img alt="Issues" src="https://img.shields.io/github/issues/lukso-network/tools-lsp-factory?color=0088ff" />
  </a>
  <a href="https://github.com/lukso-network/tools-lsp-factory/pulls">
    <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/lukso-network/tools-lsp-factory?color=0088ff" />
  </a>
</p>

<p align="center">For more information see the <a href="https://docs.lukso.tech/tools/lsp-factoryjs/getting-started">LUKSO Documentation</a>.</p>

## Supported Networks

This library deploys contracts via [LSP23LinkedContractsFactory](https://docs.lukso.tech/standards/accounts/lsp23-linked-contracts-factory), which is deployed at the same address on all supported chains via the [Nick Factory](https://eips.ethereum.org/EIPS/eip-2470) for deterministic addresses:

**LSP23 Factory Address:** `0x2300000A84D25dF63081feAa37ba6b62C4c89a30`

| Network | Chain ID |
|---|---|
| LUKSO Mainnet | 42 |
| LUKSO Testnet | 4201 |
| Ethereum Mainnet | 1 |
| BASE | 8453 |

All base contract implementations (ERC725Account, KeyManager, UniversalReceiverDelegate, LSP7, LSP8) are also deployed at the same addresses across chains via the Nick Factory.

## Install

```bash
npm install @lukso/lsp-factory.js
```

## Setup

`@lukso/lsp-factory.js` v4 uses [viem](https://viem.sh/) for blockchain interactions. You need a `PublicClient` (for reading) and a `WalletClient` (for signing transactions).

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { luksoTestnet } from 'viem/chains';
import { LSPFactory } from '@lukso/lsp-factory.js';

const account = privateKeyToAccount('0x...');

const publicClient = createPublicClient({
  chain: luksoTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: luksoTestnet,
  transport: http(),
});

const factory = new LSPFactory(publicClient, walletClient);
```

## Usage

### Deploying a Universal Profile

Deploys a Universal Profile (LSP0) and KeyManager (LSP6) atomically via [LSP23LinkedContractsFactory](https://docs.lukso.tech/standards/accounts/lsp23-linked-contracts-factory), then configures controller permissions and a Universal Receiver Delegate.

```typescript
const contracts = await factory.UniversalProfile.deploy({
  controllerAddresses: ['0x...'], // Addresses that will control the UP
});

console.log('UP Address:', contracts.LSP0ERC725Account.address);
console.log('KeyManager Address:', contracts.LSP6KeyManager.address);
```

#### With LSP3 metadata and a deterministic salt

```typescript
const contracts = await factory.UniversalProfile.deploy(
  {
    controllerAddresses: ['0x...'],
    lsp3DataValue: '0x...', // Pre-encoded LSP3Profile data (VerifiableURI)
  },
  {
    salt: '0x...', // bytes32 salt for deterministic address generation
  }
);
```

#### With custom controller permissions

```typescript
const contracts = await factory.UniversalProfile.deploy({
  controllerAddresses: [
    '0xFullPermissionsAddress', // Gets ALL_PERMISSIONS by default
    {
      address: '0xLimitedAddress',
      permissions: '0x0000000000000000000000000000000000000000000000000000000000000010',
    },
  ],
});
```

### Pre-computing Addresses

Compute the UP and KeyManager addresses before deploying:

```typescript
const { upAddress, keyManagerAddress } = await factory.UniversalProfile.computeAddress(
  { controllerAddresses: ['0x...'] },
  { salt: '0x...' } // Use the same salt you will deploy with
);
```

### Deploying an LSP7 Digital Asset

Deploys an [LSP7 Digital Asset](https://docs.lukso.tech/standards/tokens/LSP7-Digital-Asset) (fungible token) as a minimal proxy:

```typescript
const contracts = await factory.LSP7DigitalAsset.deploy({
  name: 'My Token',
  symbol: 'MTK',
  controllerAddress: '0x...', // Owner of the token contract
  tokenType: 0, // 0 = Token, 1 = NFT, 2 = Collection
  isNFT: false, // Whether the token is non-divisible
});

console.log('LSP7 Address:', contracts.LSP7DigitalAsset.address);
```

#### With metadata

```typescript
const contracts = await factory.LSP7DigitalAsset.deploy({
  name: 'My Token',
  symbol: 'MTK',
  controllerAddress: '0x...',
  tokenType: 0,
  isNFT: false,
  digitalAssetMetadata: {
    verification: {
      method: 'keccak256(utf8)',
      data: '0x...',
    },
    url: 'ipfs://Qm...',
  },
});
```

### Deploying an LSP8 Identifiable Digital Asset

Deploys an [LSP8 Identifiable Digital Asset](https://docs.lukso.tech/standards/tokens/LSP8-Identifiable-Digital-Asset) (NFT) as a minimal proxy:

```typescript
const contracts = await factory.LSP8IdentifiableDigitalAsset.deploy({
  name: 'My NFT Collection',
  symbol: 'MNFT',
  controllerAddress: '0x...',
  tokenType: 1, // 0 = Token, 1 = NFT, 2 = Collection
  tokenIdFormat: 1, // Token ID format (e.g., 1 = Number)
});

console.log('LSP8 Address:', contracts.LSP8IdentifiableDigitalAsset.address);
```

### Deployment Events

All `deploy` methods accept an `onDeployEvents` callback for tracking deployment progress:

```typescript
const contracts = await factory.UniversalProfile.deploy(
  { controllerAddresses: ['0x...'] },
  {
    onDeployEvents: {
      next: (event) => {
        console.log(event.status, event.contractName, event.functionName);
      },
      error: (error) => {
        console.error('Deployment error:', error);
      },
      complete: (deployedContracts) => {
        console.log('Deployment complete:', deployedContracts);
      },
    },
  }
);
```

## Development

### Install dependencies

```bash
npm install
```

### Lint

```bash
npm run lint
npm run lint:fix  # auto-fix
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Contributing

Please check [CONTRIBUTING](./CONTRIBUTING.md).

## License

lsp-factory.js is [Apache 2.0 licensed](./LICENSE).
