[@lukso/lsp-factory.js - v1.1.5](../README.md) / DeploymentEventBase

# Interface: DeploymentEventBase

## Hierarchy

- **`DeploymentEventBase`**

  ↳ [`DeploymentEventStandardContract`](DeploymentEventStandardContract.md)

  ↳ [`DeploymentEventBaseContract`](DeploymentEventBaseContract.md)

  ↳ [`DeploymentEventProxyContract`](DeploymentEventProxyContract.md)

  ↳ [`DeploymentEventTransaction`](DeploymentEventTransaction.md)

## Table of contents

### Properties

- [contractName](DeploymentEventBase.md#contractname)
- [receipt](DeploymentEventBase.md#receipt)
- [status](DeploymentEventBase.md#status)
- [transaction](DeploymentEventBase.md#transaction)
- [type](DeploymentEventBase.md#type)

## Properties

### contractName

• **contractName**: `string`

#### Defined in

[lib/interfaces/deployment-events.ts:20](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L20)

___

### receipt

• `Optional` **receipt**: `TransactionReceipt`

#### Defined in

[lib/interfaces/deployment-events.ts:22](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L22)

___

### status

• **status**: [`DeploymentStatus`](../enums/DeploymentStatus.md)

#### Defined in

[lib/interfaces/deployment-events.ts:19](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L19)

___

### transaction

• `Optional` **transaction**: `ContractTransaction`

#### Defined in

[lib/interfaces/deployment-events.ts:21](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L21)

___

### type

• **type**: [`DeploymentType`](../enums/DeploymentType.md)

#### Defined in

[lib/interfaces/deployment-events.ts:18](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L18)
