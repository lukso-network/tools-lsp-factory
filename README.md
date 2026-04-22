<p align="center">
  <h1 align="center"><strong>@lukso/lsp-factory.js</strong></h1>
  <p align="center">Deploy <strong>Universal Profiles</strong>, <strong>LSP7 tokens</strong>, and <strong>LSP8 NFTs</strong> on LUKSO and other EVM chains — all in a single function call.</p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lukso/lsp-factory.js">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@lukso/lsp-factory.js.svg?style=flat" />
  </a>
  <a href="https://github.com/lukso-network/tools-lsp-factory/actions">
    <img alt="Tests" src="https://github.com/lukso-network/tools-lsp-factory/actions/workflows/lint-build-test.yml/badge.svg" />
  </a>
  <a href="https://github.com/lukso-network/tools-lsp-factory/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  </a>
</p>

<p align="center">📖 <a href="https://docs.lukso.tech/tools/dapps/lsp-factoryjs/getting-started">Full Documentation</a></p>

---

Instead of manually deploying and wiring up multiple contracts, `lsp-factory.js` handles everything atomically:

- **[Universal Profiles](https://docs.lukso.tech/standards/accounts/lsp0-erc725account)** — smart accounts with built-in access control ([LSP6 KeyManager](https://docs.lukso.tech/standards/access-control/lsp6-key-manager)) and notification hooks ([LSP1 Universal Receiver](https://docs.lukso.tech/standards/accounts/lsp1-universal-receiver))
- **[LSP7 Digital Assets](https://docs.lukso.tech/standards/tokens/LSP7-Digital-Asset)** — fungible tokens (think ERC-20 but richer)
- **[LSP8 Identifiable Digital Assets](https://docs.lukso.tech/standards/tokens/LSP8-Identifiable-Digital-Asset)** — NFTs (think ERC-721 with better metadata)

Deployments use [viem](https://viem.sh/) and [LSP23LinkedContractsFactory](https://docs.lukso.tech/standards/factories/lsp23-linked-contracts-factory) — so linked contracts (e.g., a Universal Profile + its Key Manager) are always deployed together in a single transaction.

**Requirements:** Node.js >= 22 · TypeScript >= 5.9

---

## Supported Networks

| Network          | Chain ID |
| ---------------- | -------- |
| LUKSO Mainnet    | 42       |
| LUKSO Testnet    | 4201     |
| Ethereum Mainnet | 1        |
| BASE             | 8453     |

All factory contracts are deployed at the same deterministic address on every supported chain (`0x2300000A84D25dF63081feAa37ba6b62C4c89a30`).

---

## Install

```bash
npm install @lukso/lsp-factory.js
```

---

## Setup

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { luksoTestnet } from 'viem/chains'; // swap for any supported chain
import { LSPFactory } from '@lukso/lsp-factory.js';

const account = privateKeyToAccount('0x...');

const factory = new LSPFactory(
  createPublicClient({ chain: luksoTestnet, transport: http() }),
  createWalletClient({ account, chain: luksoTestnet, transport: http() }),
);
```

---

## Deploy a Universal Profile

Deploys a Universal Profile + Key Manager atomically, sets up controller permissions and a Universal Receiver Delegate.

```typescript
const { LSP0ERC725Account, LSP6KeyManager } = await factory.UniversalProfile.deploy({
  controllerAddresses: ['0x...'], // wallet(s) that will control this profile
});

console.log('Profile:', LSP0ERC725Account.address);
console.log('Key Manager:', LSP6KeyManager.address);
```

**With profile metadata** (name, avatar, description via LSP3):

```typescript
import { ERC725 } from '@erc725/erc725.js';
import LSP3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';

const { values } = new ERC725(LSP3ProfileSchema).encodeData([
  { keyName: 'LSP3Profile', value: { json: metadata, url: 'ipfs://...' } },
]);

await factory.UniversalProfile.deploy(
  { controllerAddresses: ['0x...'], lsp3DataValue: values[0] },
  { salt: '0x...' }, // optional: makes the address deterministic
);
```

**With custom controller permissions:**

```typescript
import { ERC725 } from '@erc725/erc725.js';

await factory.UniversalProfile.deploy({
  controllerAddresses: [
    '0xAdmin...',      // gets ALL_PERMISSIONS by default
    {
      address: '0xAgent...',
      permissions: ERC725.encodePermissions({ SUPER_SETDATA: true }),
    },
  ],
});
```

**Pre-compute addresses before deploying:**

```typescript
const { upAddress, keyManagerAddress } = await factory.UniversalProfile.computeAddress(
  { controllerAddresses: ['0x...'] },
  { salt: '0x...' },
);
```

---

## Deploy an LSP7 Token (Fungible)

```typescript
const { LSP7DigitalAsset } = await factory.LSP7DigitalAsset.deploy({
  name: 'My Token',
  symbol: 'MTK',
  controllerAddress: '0x...', // token owner
  tokenType: 0,    // 0 = Token · 1 = NFT · 2 = Collection
  isNFT: false,    // true = non-divisible (0 decimals)
});

console.log('Token:', LSP7DigitalAsset.address);
```

**With on-chain metadata:**

```typescript
await factory.LSP7DigitalAsset.deploy({
  name: 'My Token',
  symbol: 'MTK',
  controllerAddress: '0x...',
  tokenType: 0,
  isNFT: false,
  digitalAssetMetadata: {
    verification: { method: 'keccak256(bytes)', data: '0x...' },
    url: 'ipfs://Qm...',
  },
});
```

---

## Deploy an LSP8 NFT (Non-Fungible)

```typescript
const { LSP8IdentifiableDigitalAsset } = await factory.LSP8IdentifiableDigitalAsset.deploy({
  name: 'My Collection',
  symbol: 'MNFT',
  controllerAddress: '0x...',
  tokenType: 1,        // 0 = Token · 1 = NFT · 2 = Collection
  tokenIdFormat: 1,    // 0 = bytes32 · 1 = number · 2 = string · 3 = address · 4 = hash
});

console.log('NFT:', LSP8IdentifiableDigitalAsset.address);
```

---

## Track Deployment Progress

All `deploy` methods accept an optional `onDeployEvents` callback:

```typescript
await factory.UniversalProfile.deploy(
  { controllerAddresses: ['0x...'] },
  {
    onDeployEvents: {
      next: (event) => console.log(event.status, event.contractName),
      error: (err) => console.error(err),
      complete: (contracts) => console.log('Done!', contracts),
    },
  },
);
```

---

## Development

```bash
npm install      # install dependencies
npm run lint     # check code style
npm run build    # compile TypeScript
npm test         # run tests
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[Apache 2.0](./LICENSE)
