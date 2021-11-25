[@lukso/lsp-factory.js - v1.1.5](../README.md) / DeploymentEventTransaction

# Interface: DeploymentEventTransaction

## Hierarchy

- [`DeploymentEventBase`](DeploymentEventBase.md)

  ↳ **`DeploymentEventTransaction`**

## Table of contents

### Properties

- [contractName](DeploymentEventTransaction.md#contractname)
- [functionName](DeploymentEventTransaction.md#functionname)
- [receipt](DeploymentEventTransaction.md#receipt)
- [status](DeploymentEventTransaction.md#status)
- [transaction](DeploymentEventTransaction.md#transaction)
- [type](DeploymentEventTransaction.md#type)

## Properties

### contractName

• **contractName**: `string`

#### Inherited from

[DeploymentEventBase](DeploymentEventBase.md).[contractName](DeploymentEventBase.md#contractname)

#### Defined in

[lib/interfaces/deployment-events.ts:20](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L20)

___

### functionName

• **functionName**: `string`

#### Defined in

[lib/interfaces/deployment-events.ts:43](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L43)

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

• **transaction**: `ContractTransaction`

#### Overrides

[DeploymentEventBase](DeploymentEventBase.md).[transaction](DeploymentEventBase.md#transaction)

#### Defined in

[lib/interfaces/deployment-events.ts:44](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L44)

___

### type

• **type**: [`TRANSACTION`](../enums/DeploymentType.md#transaction)

#### Overrides

[DeploymentEventBase](DeploymentEventBase.md).[type](DeploymentEventBase.md#type)

#### Defined in

[lib/interfaces/deployment-events.ts:42](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L42)
