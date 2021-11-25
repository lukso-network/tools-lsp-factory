[@lukso/lsp-factory.js](../README.md) / DeploymentEventProxyContract

# Interface: DeploymentEventProxyContract

## Hierarchy

- [`DeploymentEventBase`](DeploymentEventBase.md)

  ↳ **`DeploymentEventProxyContract`**

## Table of contents

### Properties

- [contractName](DeploymentEventProxyContract.md#contractname)
- [functionName](DeploymentEventProxyContract.md#functionname)
- [receipt](DeploymentEventProxyContract.md#receipt)
- [status](DeploymentEventProxyContract.md#status)
- [transaction](DeploymentEventProxyContract.md#transaction)
- [type](DeploymentEventProxyContract.md#type)

## Properties

### contractName

• **contractName**: `string`

#### Inherited from

[DeploymentEventBase](DeploymentEventBase.md).[contractName](DeploymentEventBase.md#contractname)

#### Defined in

[lib/interfaces/deployment-events.ts:20](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/deployment-events.ts#L20)

___

### functionName

• `Optional` **functionName**: `string`

#### Defined in

[lib/interfaces/deployment-events.ts:34](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/deployment-events.ts#L34)

___

### receipt

• `Optional` **receipt**: `TransactionReceipt`

#### Inherited from

[DeploymentEventBase](DeploymentEventBase.md).[receipt](DeploymentEventBase.md#receipt)

#### Defined in

[lib/interfaces/deployment-events.ts:22](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/deployment-events.ts#L22)

___

### status

• **status**: [`DeploymentStatus`](../enums/DeploymentStatus.md)

#### Inherited from

[DeploymentEventBase](DeploymentEventBase.md).[status](DeploymentEventBase.md#status)

#### Defined in

[lib/interfaces/deployment-events.ts:19](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/deployment-events.ts#L19)

___

### transaction

• `Optional` **transaction**: `ContractTransaction`

#### Inherited from

[DeploymentEventBase](DeploymentEventBase.md).[transaction](DeploymentEventBase.md#transaction)

#### Defined in

[lib/interfaces/deployment-events.ts:21](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/deployment-events.ts#L21)

___

### type

• **type**: [`PROXY`](../enums/DeploymentType.md#proxy)

#### Overrides

[DeploymentEventBase](DeploymentEventBase.md).[type](DeploymentEventBase.md#type)

#### Defined in

[lib/interfaces/deployment-events.ts:33](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/deployment-events.ts#L33)
