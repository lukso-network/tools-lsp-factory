[@lukso/lsp-factory.js](../README.md) / [Exports](../modules.md) / LSP3UniversalProfile

# Class: LSP3UniversalProfile

TODO: docs

## Table of contents

### Constructors

- [constructor](LSP3UniversalProfile.md#constructor)

### Properties

- [options](LSP3UniversalProfile.md#options)
- [signer](LSP3UniversalProfile.md#signer)

### Methods

- [deploy](LSP3UniversalProfile.md#deploy)
- [preDeployContracts](LSP3UniversalProfile.md#predeploycontracts)
- [uploadProfileData](LSP3UniversalProfile.md#uploadprofiledata)

## Constructors

### constructor

• **new LSP3UniversalProfile**(`options`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`LSPFactoryOptions`](../interfaces/LSPFactoryOptions.md) |

#### Defined in

[src/lib/classes/lsp3-universal-profile.ts:30](https://github.com/lukso-network/tools-lsp-factory/blob/c1d9183/src/lib/classes/lsp3-universal-profile.ts#L30)

## Properties

### options

• **options**: [`LSPFactoryOptions`](../interfaces/LSPFactoryOptions.md)

#### Defined in

[src/lib/classes/lsp3-universal-profile.ts:28](https://github.com/lukso-network/tools-lsp-factory/blob/c1d9183/src/lib/classes/lsp3-universal-profile.ts#L28)

___

### signer

• **signer**: `NonceManager`

#### Defined in

[src/lib/classes/lsp3-universal-profile.ts:29](https://github.com/lukso-network/tools-lsp-factory/blob/c1d9183/src/lib/classes/lsp3-universal-profile.ts#L29)

## Methods

### deploy

▸ **deploy**(`profileDeploymentOptions`, `contractDeploymentOptions?`): `Observable`<`LSP3AccountDeploymentEvent` \| [`DeploymentEventTransaction`](../interfaces/DeploymentEventTransaction.md)\>

TODO: docs

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileDeploymentOptions` | [`ProfileDeploymentOptions`](../interfaces/ProfileDeploymentOptions.md) |
| `contractDeploymentOptions?` | [`ContractDeploymentOptions`](../interfaces/ContractDeploymentOptions.md) |

#### Returns

`Observable`<`LSP3AccountDeploymentEvent` \| [`DeploymentEventTransaction`](../interfaces/DeploymentEventTransaction.md)\>

#### Defined in

[src/lib/classes/lsp3-universal-profile.ts:38](https://github.com/lukso-network/tools-lsp-factory/blob/c1d9183/src/lib/classes/lsp3-universal-profile.ts#L38)

___

### preDeployContracts

▸ **preDeployContracts**(`version?`): `Promise`<`void`\>

Pre-deploys the latest Version of the LSP3UniversalProfile smart-contracts.

#### Parameters

| Name | Type |
| :------ | :------ |
| `version?` | ``"string"`` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/lib/classes/lsp3-universal-profile.ts:88](https://github.com/lukso-network/tools-lsp-factory/blob/c1d9183/src/lib/classes/lsp3-universal-profile.ts#L88)

___

### uploadProfileData

▸ `Static` **uploadProfileData**(`profileData`, `uploadOptions?`): `Promise`<`Object`\>

Uploads the LSP3Profile to the desired endpoint. This can be an `https` URL either pointing to
a public, centralized storage endpoint or an IPFS Node / Cluster

**`memberof`** LSP3UniversalProfile

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileData` | [`ProfileDataBeforeUpload`](../interfaces/ProfileDataBeforeUpload.md) |
| `uploadOptions?` | `ProfileUploadOptions` |

#### Returns

`Promise`<`Object`\>

{(Promise<AddResult | string>)}

#### Defined in

[src/lib/classes/lsp3-universal-profile.ts:100](https://github.com/lukso-network/tools-lsp-factory/blob/c1d9183/src/lib/classes/lsp3-universal-profile.ts#L100)
