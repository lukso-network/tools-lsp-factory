[@lukso/lsp-factory.js - v1.1.5](../README.md) / DeploymentEventStandardContract

# Interface: DeploymentEventStandardContract

## Hierarchy

- [`DeploymentEventBase`](DeploymentEventBase.md)

  ↳ **`DeploymentEventStandardContract`**

## Table of contents

### Properties

- [contractName](DeploymentEventStandardContract.md#contractname)
- [receipt](DeploymentEventStandardContract.md#receipt)
- [status](DeploymentEventStandardContract.md#status)
- [transaction](DeploymentEventStandardContract.md#transaction)
- [type](DeploymentEventStandardContract.md#type)

## Properties

### contractName

• **contractName**: `string`

#### Inherited from

[DeploymentEventBase](DeploymentEventBase.md).[contractName](DeploymentEventBase.md#contractname)

#### Defined in

[lib/interfaces/deployment-events.ts:20](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L20)

___

### receipt

• `Optional` **receipt**: `TransactionReceipt`

#### Inherited from

[DeploymentEventBase](DeploymentEventBase.md).[receipt](DeploymentEventBase.md#receipt)

#### Defined in

[lib/interfaces/deployment-events.ts:22](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L22)

___

### status

• **status**: [`DeploymentStatus`](../enums/DeploymentStatus.md)

#### Inherited from

[DeploymentEventBase](DeploymentEventBase.md).[status](DeploymentEventBase.md#status)

#### Defined in

[lib/interfaces/deployment-events.ts:19](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L19)

___

### transaction

• `Optional` **transaction**: `ContractTransaction`

#### Inherited from

[DeploymentEventBase](DeploymentEventBase.md).[transaction](DeploymentEventBase.md#transaction)

#### Defined in

[lib/interfaces/deployment-events.ts:21](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L21)

___

### type

• **type**: [`CONTRACT`](../enums/DeploymentType.md#contract)

#### Overrides

[DeploymentEventBase](DeploymentEventBase.md).[type](DeploymentEventBase.md#type)

#### Defined in

[lib/interfaces/deployment-events.ts:26](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L26)
