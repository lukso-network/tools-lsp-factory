---
sidebar_position: 1.3
---

## deploy

```js
lspFactory.LSP8IdentifiableDigitalAsset.deploy(
  digitalAssetDeploymentOptions,
  contractDeploymentOptions?);
```

Deploys a mintable [LSP8 Identifiable Digital Asset](../../../standards/nft-2.0/LSP8-Identifiable-Digital-Asset).

#### Parameters

1. `digitalAssetDeploymentOptions` - `Object` The [options used for deployment](../../../../../standards/smart-contracts/lsp8-identifiable-digital-asset#constructor).
   - `name` - `string`: The name of the token.
   - `symbol` - `string`: The symbol of the token.
   - `ownerAddress` - `string` : The owner of the contract.
2. `contractDeploymentOptions?` - `Object`
  - `version` - `string`: The version of LSP8 Contract you want to deploy
  - `byteCode` - `string`: Custom bytecode to be deployed
  - `libAddress` - `string`: The Address of a Base Contract to be used in deployment
  - `deployReactive` - `boolean`: Whether to return an RxJS Observable of deployment events

#### Returns

`Promise`<`DeployedContracts`\> | `Observable`<`DigitalAssetDeploymentEvent`\>

Promise with deployed contract details.

If `deployReactive` flag is set to `true` in the `ContractDeploymentOptions` object, returns an [RxJS Observable](https://rxjs.dev/guide/observable) of deployment events.

#### Example

```javascript
await lspFactory.LSP8IdentifiableDigitalAsset.deploy({
  name: 'My token',
  symbol: 'TKN',
  ownerAddress: '0xb74a88C43BCf691bd7A851f6603cb1868f6fc147',
});

/**
{
  LSP8IdentifiableDigitalAsset: {
    address: '0x336a4751a078Fe3f7af4ff2f194f7481f957b04a',
    receipt: {
      to: null,
      from: '0x9Fba07e245B415cC9580BD6c890a9fd7D22e20db',
      contractAddress: '0x336a4751a078Fe3f7af4ff2f194f7481f957b04a',
      transactionIndex: 0,
      gasUsed: [BigNumber],
      logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      blockHash: '0x7c7a8a2723bbdfd257f3bc0bd27edcf98d9d119f70971f80a6066449ea5922ae',
      transactionHash: '0x05c791245a29b8cd2167bab41f56fbaf79d7a64814c1e161a2de352cead9c3fd',
      logs: [],
      blockNumber: 12028969,
      confirmations: 1,
      cumulativeGasUsed: [BigNumber],
      status: 1,
      type: 0,
      byzantium: true,
      events: []
    }
  }
}
*/
```

```javascript title="Reactive LSP8 Identifiable Digital Asset deployment"
await lspFactory.LSP8IdentifiableDigitalAsset.deploy(
  {
    name: 'My token',
    symbol: 'TKN',
    ownerAddress: '0xb74a88C43BCf691bd7A851f6603cb1868f6fc147',
  },
  { deployReactive: true }
).subscribe({
  next: (deploymentEvent) => {
    console.log(deploymentEvent);
  },
  complete: () => {
    console.log('Deployment Complete');
  },
});

/**
{
  type: 'PROXY',
  contractName: 'LSP8IdentifiableDigitalAsset',
  status: 'PENDING',
  transaction: {
     ...
  }
}
{
  type: 'PROXY',
  contractName: 'LSP8IdentifiableDigitalAsset',
  status: 'PENDING',
  receipt: {
    ...
  }
}
{
  type: 'PROXY',
  contractName: 'LSP8IdentifiableDigitalAsset',
  functionName: 'initialize',
  status: 'PENDING',
  transaction: {
    ...
  }
}
{
  type: 'PROXY',
  contractName: 'LSP8IdentifiableDigitalAsset',
  functionName: 'initialize',
  status: 'COMPLETE',
  receipt: {
    ...
  }
}
*/
```
