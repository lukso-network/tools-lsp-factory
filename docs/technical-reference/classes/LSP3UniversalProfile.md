[@lukso/lsp-factory.js - v1.1.5](../README.md) / LSP3UniversalProfile

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
- [deployBaseContracts](LSP3UniversalProfile.md#deploybasecontracts)
- [deployReactive](LSP3UniversalProfile.md#deployreactive)
- [getDeployedByteCode](LSP3UniversalProfile.md#getdeployedbytecode)
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

[lib/classes/lsp3-universal-profile.ts:38](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/classes/lsp3-universal-profile.ts#L38)

## Properties

### options

• **options**: [`LSPFactoryOptions`](../interfaces/LSPFactoryOptions.md)

#### Defined in

[lib/classes/lsp3-universal-profile.ts:36](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/classes/lsp3-universal-profile.ts#L36)

___

### signer

• **signer**: `NonceManager`

#### Defined in

[lib/classes/lsp3-universal-profile.ts:37](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/classes/lsp3-universal-profile.ts#L37)

## Methods

### deploy

▸ **deploy**(`profileDeploymentOptions`, `contractDeploymentOptions?`): `Promise`<[`DeployedContracts`](../interfaces/DeployedContracts.md)\>

TODO: docs

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileDeploymentOptions` | [`ProfileDeploymentOptions`](../interfaces/ProfileDeploymentOptions.md) |
| `contractDeploymentOptions?` | [`ContractDeploymentOptions`](../interfaces/ContractDeploymentOptions.md) |

#### Returns

`Promise`<[`DeployedContracts`](../interfaces/DeployedContracts.md)\>

#### Defined in

[lib/classes/lsp3-universal-profile.ts:123](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/classes/lsp3-universal-profile.ts#L123)

___

### deployBaseContracts

▸ **deployBaseContracts**(): `Promise`<[`DeployedContracts`](../interfaces/DeployedContracts.md)\>

#### Returns

`Promise`<[`DeployedContracts`](../interfaces/DeployedContracts.md)\>

#### Defined in

[lib/classes/lsp3-universal-profile.ts:150](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/classes/lsp3-universal-profile.ts#L150)

___

### deployReactive

▸ **deployReactive**(`profileDeploymentOptions`, `contractDeploymentOptions?`): `Observable`<`LSP3AccountDeploymentEvent` \| [`DeploymentEventTransaction`](../interfaces/DeploymentEventTransaction.md)\>

TODO: docs

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileDeploymentOptions` | [`ProfileDeploymentOptions`](../interfaces/ProfileDeploymentOptions.md) |
| `contractDeploymentOptions?` | [`ContractDeploymentOptions`](../interfaces/ContractDeploymentOptions.md) |

#### Returns

`Observable`<`LSP3AccountDeploymentEvent` \| [`DeploymentEventTransaction`](../interfaces/DeploymentEventTransaction.md)\>

#### Defined in

[lib/classes/lsp3-universal-profile.ts:46](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/classes/lsp3-universal-profile.ts#L46)

___

### getDeployedByteCode

▸ **getDeployedByteCode**(`contractAddress`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `contractAddress` | `string` |

#### Returns

`Promise`<`string`\>

#### Defined in

[lib/classes/lsp3-universal-profile.ts:146](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/classes/lsp3-universal-profile.ts#L146)

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

[lib/classes/lsp3-universal-profile.ts:180](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/classes/lsp3-universal-profile.ts#L180)

___

### uploadProfileData

▸ `Static` **uploadProfileData**(`profileData`, `uploadOptions?`): `Promise`<`LSP3ProfileDataForEncoding`\>

Uploads the LSP3Profile to the desired endpoint. This can be an `https` URL either pointing to
a public, centralized storage endpoint or an IPFS Node / Cluster

**`memberof`** LSP3UniversalProfile

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileData` | [`ProfileDataBeforeUpload`](../interfaces/ProfileDataBeforeUpload.md) |
| `uploadOptions?` | `ProfileUploadOptions` |

#### Returns

`Promise`<`LSP3ProfileDataForEncoding`\>

{(Promise<AddResult | string>)}

#### Defined in

[lib/classes/lsp3-universal-profile.ts:192](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/classes/lsp3-universal-profile.ts#L192)
