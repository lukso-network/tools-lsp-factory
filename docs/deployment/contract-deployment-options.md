---
sidebar_position: 1.4
title: Contract Deployment Options
---

When using `LSPFactory` you have the ability to specify custom deployment parameters to be applied to your contracts.

The `deploy` function takes an object `contractDeploymentOptions` as its second parameter where the contract `version`, `byteCode` and `libAddress` can be specified:

> `contractDeploymentOptions?` - `Object`:

- `version?` - `string`: The Contract version you want to deploy. Defaults to latest version of [lsp-smart-contracts](https://github.com/lukso-network/lsp-smart-contracts) library.
- `byteCode?` - `string`: Custom bytecode to be deployed.
- `deployProxy?` - `boolean`: Whether the contract should be deployed using a proxy contract implementation (eg: [EIP1167](https://eips.ethereum.org/EIPS/eip-1167)). Defaults to true.
- `libAddress?` - `string`: The Address of a Base Contract to be used in deployment as implementation behind a proxy contract (eg: [EIP1167](https://eips.ethereum.org/EIPS/eip-1167)).

This is an optional parameter and so may be omitted. If no contract deployment options are specified, `LSPFactory` will deploy a proxy contract which defers to a base contract implementation as per the [EIP1167](https://eips.ethereum.org/EIPS/eip-1167) standard.

If you do not want your contract to use proxy deployment you can set `deployProxy` to `false`. This will deploy a 'full' contract with constructor rather than using a proxy deployment with initializer.

:::info Info
LSPFactory stores base contract addresses for different versions [internally](https://github.com/lukso-network/tools-lsp-factory/blob/main/src/versions.json) and uses the latest available version if no version is specified.
:::

#### Custom Bytecode

You can specify the bytecode you want your contract to use by providing the `byteCode` parameter. Unless `deployProxy` is set to `false`, LSPFactory will deploy a proxy contract which will defer to a base contract where your bytecode is deployed.

For example, you could deploy a Universal Profile with a KeyManager which uses your custom bytecode as a base contract implementation:

```javascript title="Deploying a Universal Profile with a custom KeyManager base contract"
lspFactory.LSP3UniversalProfile.deploy({...}, {
    version: '0.4.1'
    KeyManager: {
        bytecode: '0x...',
    }
})
```

Or if you want to use your custom bytecode for the KeyManager contract itself (rather than for a base contract behind a proxy), you can set deployProxy to `false`:

```javascript title="Deploying a Universal Profile with a custom KeyManager base contract"
lspFactory.LSP3UniversalProfile.deploy({...}, {
    version: '0.4.1'
    KeyManager: {
        bytecode: '0x...',
        deployProxy: false
    }
})
```

### Custom Universal Profile Deployment

A [Universal Profile](../classes/lsp3-universal-profile) is composed of three different contracts. By passing the global `version` parameter you can set the version for all contracts at once.

```javascript title="Deploying a Universal Profile with all contracts at version 0.4.1"
lspFactory.LSP3UniversalProfile.deploy({...}, {
    version: '0.4.1'
})
```

<!-- :::info Infos -->

**LSPFactory also allows contracts to be individually customisable. You can set the version per contract which will take precedence over the global version:**

<!-- ::: -->

```javascript title="Deploying a Universal Profile at version 0.4.1 with ERC725Account contract at version 0.3.9"
lspFactory.LSP3UniversalProfile.deploy({...}, {
    version: '0.4.1'
    ERC725Account: {
        version: '0.3.9'
    }
})
```

Or use a combination of `libAddress`, `bytecode` and `version`:

```javascript title="Deploying a Universal Profile with specific contract deployment options"
lspFactory.LSP3UniversalProfile.deploy({...}, {
    ERC725Account: {
        version: '0.4.1',
    }
    UniversalRecieverDelegate: {
        baseContract: '0x...'
    }
    KeyManager: {
        libAddress: '0x6c1F3Ed2F99054C88897e2f32187ef15c62dC560'
    }
})
```

### Custom Digital Asset Deployment

Deploying a [`LSP7DigitalAsset`](../classes/lsp7-digital-asset) or [`LSP8IdentifiableDigitalAsset`](../classes/lsp8-identifiable-digital-asset) involves deploying only one contract so these standards share the same `contractDeploymentOptions` object structure:

```javascript title="Deploying an LSP7 Digital Asset with a specified base contract address"
lspFactory.LSP7DigitalAsset.deploy({...}, {
    libAddress: '0xdD373889355d37D6cb9A5028Ce74cDBacC7CF782'
})
```

```javascript title="Deploying a specific version of LSP8 Identifiable Digital Asset"
lspFactory.LSP8IdentifiableDigitalAsset.deploy({...}, {
    version: '0.1.1'
})
```

```javascript title="Deploying specific bytecode for LSP8 Identifiable Digital Asset base contract"
lspFactory.LSP8IdentifiableDigitalAsset.deploy({...}, {
    bytecode: '0x...'
})
```
