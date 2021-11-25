[@lukso/lsp-factory.js](../README.md) / ProfileDeploymentOptions

# Interface: ProfileDeploymentOptions

TBD

## Table of contents

### Properties

- [baseContractAddresses](ProfileDeploymentOptions.md#basecontractaddresses)
- [controllingAccounts](ProfileDeploymentOptions.md#controllingaccounts)
- [lsp3Profile](ProfileDeploymentOptions.md#lsp3profile)

## Properties

### baseContractAddresses

• `Optional` **baseContractAddresses**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `erc725Account?` | `string` |
| `keyManager?` | `string` |
| `universalReceiverDelegate?` | `string` |

#### Defined in

[lib/interfaces/profile-deployment.ts:23](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/profile-deployment.ts#L23)

___

### controllingAccounts

• **controllingAccounts**: (`string` \| [`ControllerOptions`](ControllerOptions.md))[]

#### Defined in

[lib/interfaces/profile-deployment.ts:21](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/profile-deployment.ts#L21)

___

### lsp3Profile

• `Optional` **lsp3Profile**: `string` \| [`ProfileDataBeforeUpload`](ProfileDataBeforeUpload.md)

#### Defined in

[lib/interfaces/profile-deployment.ts:22](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/profile-deployment.ts#L22)
