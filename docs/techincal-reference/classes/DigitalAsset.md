[@lukso/lsp-factory.js](../README.md) / DigitalAsset

# Class: DigitalAsset

## Table of contents

### Constructors

- [constructor](DigitalAsset.md#constructor)

### Properties

- [options](DigitalAsset.md#options)
- [signer](DigitalAsset.md#signer)

### Methods

- [deployBaseContracts](DigitalAsset.md#deploybasecontracts)
- [deployLSP7DigitalAsset](DigitalAsset.md#deploylsp7digitalasset)
- [deployLSP7DigitalAssetReactive](DigitalAsset.md#deploylsp7digitalassetreactive)
- [deployLSP8IdentifiableDigitalAsset](DigitalAsset.md#deploylsp8identifiabledigitalasset)
- [deployLSP8IdentifiableDigitalAssetReactive](DigitalAsset.md#deploylsp8identifiabledigitalassetreactive)

## Constructors

### constructor

• **new DigitalAsset**(`options`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`LSPFactoryOptions`](../interfaces/LSPFactoryOptions.md) |

#### Defined in

[lib/classes/digital-asset.ts:22](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/classes/digital-asset.ts#L22)

## Properties

### options

• **options**: [`LSPFactoryOptions`](../interfaces/LSPFactoryOptions.md)

#### Defined in

[lib/classes/digital-asset.ts:20](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/classes/digital-asset.ts#L20)

___

### signer

• **signer**: `NonceManager`

#### Defined in

[lib/classes/digital-asset.ts:21](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/classes/digital-asset.ts#L21)

## Methods

### deployBaseContracts

▸ **deployBaseContracts**(): `Promise`<`DeployedContracts`\>

#### Returns

`Promise`<`DeployedContracts`\>

#### Defined in

[lib/classes/digital-asset.ts:106](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/classes/digital-asset.ts#L106)

___

### deployLSP7DigitalAsset

▸ **deployLSP7DigitalAsset**(`digitalAssetDeploymentOptions`, `contractDeploymentOptions?`): `Promise`<`DeployedContracts`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `digitalAssetDeploymentOptions` | `LSP7DigitalAssetDeploymentOptions` |
| `contractDeploymentOptions?` | `ContractDeploymentOptions` |

#### Returns

`Promise`<`DeployedContracts`\>

#### Defined in

[lib/classes/digital-asset.ts:42](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/classes/digital-asset.ts#L42)

___

### deployLSP7DigitalAssetReactive

▸ **deployLSP7DigitalAssetReactive**(`digitalAssetDeploymentOptions`, `contractDeploymentOptions?`): `Observable`<`DigitalAssetDeploymentEvent`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `digitalAssetDeploymentOptions` | `LSP7DigitalAssetDeploymentOptions` |
| `contractDeploymentOptions?` | `ContractDeploymentOptions` |

#### Returns

`Observable`<`DigitalAssetDeploymentEvent`\>

#### Defined in

[lib/classes/digital-asset.ts:29](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/classes/digital-asset.ts#L29)

___

### deployLSP8IdentifiableDigitalAsset

▸ **deployLSP8IdentifiableDigitalAsset**(`digitalAssetDeploymentOptions`, `ContractDeploymentOptions?`): `Promise`<`DeployedContracts`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `digitalAssetDeploymentOptions` | `DigitalAssetDeploymentOptions` |
| `ContractDeploymentOptions?` | `ContractDeploymentOptions` |

#### Returns

`Promise`<`DeployedContracts`\>

#### Defined in

[lib/classes/digital-asset.ts:83](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/classes/digital-asset.ts#L83)

___

### deployLSP8IdentifiableDigitalAssetReactive

▸ **deployLSP8IdentifiableDigitalAssetReactive**(`digitalAssetDeploymentOptions`, `contractDeploymentOptions?`): `Observable`<`DigitalAssetDeploymentEvent`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `digitalAssetDeploymentOptions` | `DigitalAssetDeploymentOptions` |
| `contractDeploymentOptions?` | `ContractDeploymentOptions` |

#### Returns

`Observable`<`DigitalAssetDeploymentEvent`\>

#### Defined in

[lib/classes/digital-asset.ts:67](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/classes/digital-asset.ts#L67)
