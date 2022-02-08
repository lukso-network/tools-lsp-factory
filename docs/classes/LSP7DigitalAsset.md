---
sidebar_position: 1.3
---

## deploy

```js
lspFactory.LSP7DigitalAsset.deploy(
  digitalAssetDeploymentOptions,
  contractDeploymentOptions?);
```

Deploys a mintable [LSP7 Digital Asset](../../../standards/nft-2.0/LSP7-Digital-Asset).

#### Parameters

1. `digitalAssetDeploymentOptions` - `Object`: The [options used for deployment](../../../../../standards/smart-contracts/lsp7-digital-asset#constructor).
   - `name` - `string`: The name of the token.
   - `symbol` - `string`: The symbol of the token.
   - `ownerAddress` - `string` : The owner of the contract.
   - `isNFT` - `boolean`: Specify if the contract represent a fungible or a non-fungible token.
2. `contractDeploymentOptions?` - `Object`
  - `version` - `string`: The version of LSP7 Contract you want to deploy
  - `byteCode` - `string`: Custom bytecode to be deployed
  - `libAddress` - `string`: The Address of a Base Contract to be used in deployment
  - `deployReactive` - `boolean`: Whether to return an RxJS Observable of deployment events

#### Returns

`Promise`<`DeployedContracts`\> | `Observable`<`DigitalAssetDeploymentEvent`\>

Returns a Promise with object containing deployed contract details.

If `deployReactive` flag is set to `true` in the `ContractDeploymentOptions` object, returns an [RxJS Observable](https://rxjs.dev/guide/observable) of deployment events.

#### Example

```javascript title="LSP7 Digital Asset deployment"
await lspFactory.LSP7DigitalAsset.deploy({
  name: 'My token',
  symbol: 'TKN',
  ownerAddress: '0xb74a88C43BCf691bd7A851f6603cb1868f6fc147',
  isNFT: true,
});

/**
{
  LSP7DigitalAsset: {
    address: '0x32208e331d023c2ABcdfD160Ee25B97219aEfCD9',
    receipt: {
      to: null,
      from: '0x9Fba07e245B415cC9580BD6c890a9fd7D22e20db',
      contractAddress: '0x32208e331d023c2ABcdfD160Ee25B97219aEfCD9',
      transactionIndex: 0,
      gasUsed: [BigNumber],
      logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      blockHash: '0x1b44bd472b1b202620a78847138692828149e7f692763c884d99a9adf0b8a94c',
      transactionHash: '0xe923acc3431ef24fc11103b53b4219611d0f72e59734fc3c7db8da3eb4564844',
      logs: [],
      blockNumber: 12028918,
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

```javascript title="Reactive LSP7 Digital Asset deployment"
await lspFactory.LSP7DigitalAsset.deploy(
  {
    name: 'My token',
    symbol: 'TKN',
    ownerAddress: '0xb74a88C43BCf691bd7A851f6603cb1868f6fc147',
    isNFT: true,
  },
  {
    deployReactive: true,
  }
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
  contractName: 'LSP7DigitalAsset',
  status: 'PENDING',
  transaction: {
    ...
  }
}
{
  type: 'PROXY',
  contractName: 'LSP7DigitalAsset',
  status: 'PENDING',
  receipt: {
    ...
  }
}
{
  type: 'PROXY',
  contractName: 'LSP7DigitalAsset',
  functionName: 'initialize',
  status: 'PENDING',
  transaction: {
    ...
  }
}
{
  type: 'PROXY',
  contractName: 'LSP7DigitalAsset',
  functionName: 'initialize',
  status: 'COMPLETE',
  receipt: {
    ...
  }
}
Deployment Complete
*/
```
