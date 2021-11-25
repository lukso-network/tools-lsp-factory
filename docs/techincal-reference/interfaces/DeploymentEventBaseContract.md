[@lukso/lsp-factory.js - v1.1.5](../README.md) / DeploymentEventBaseContract

# Interface: DeploymentEventBaseContract

## Hierarchy

- [`DeploymentEventBase`](DeploymentEventBase.md)

  ↳ **`DeploymentEventBaseContract`**

## Table of contents

### Properties

- [contractName](DeploymentEventBaseContract.md#contractname)
- [receipt](DeploymentEventBaseContract.md#receipt)
- [status](DeploymentEventBaseContract.md#status)
- [transaction](DeploymentEventBaseContract.md#transaction)
- [type](DeploymentEventBaseContract.md#type)

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

• **type**: [`BASE_CONTRACT`](../enums/DeploymentType.md#base_contract)

#### Overrides

[DeploymentEventBase](DeploymentEventBase.md).[type](DeploymentEventBase.md#type)

#### Defined in

[lib/interfaces/deployment-events.ts:29](https://github.com/lukso-network/tools-lsp-factory/blob/8e385a2/src/lib/interfaces/deployment-events.ts#L29)
