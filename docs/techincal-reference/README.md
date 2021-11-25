@lukso/lsp-factory.js

# @lukso/lsp-factory.js

## Table of contents

### Enumerations

- [ContractNames](enums/ContractNames.md)
- [DeploymentStatus](enums/DeploymentStatus.md)
- [DeploymentType](enums/DeploymentType.md)

### Classes

- [DigitalAsset](classes/DigitalAsset.md)
- [LSP3UniversalProfile](classes/LSP3UniversalProfile.md)
- [LSPFactory](classes/LSPFactory.md)

### Interfaces

- [BaseContractAddresses](interfaces/BaseContractAddresses.md)
- [ContractDeploymentOptions](interfaces/ContractDeploymentOptions.md)
- [ContractOptions](interfaces/ContractOptions.md)
- [ControllerOptions](interfaces/ControllerOptions.md)
- [DeployedContracts](interfaces/DeployedContracts.md)
- [DeploymentEventBase](interfaces/DeploymentEventBase.md)
- [DeploymentEventBaseContract](interfaces/DeploymentEventBaseContract.md)
- [DeploymentEventProxyContract](interfaces/DeploymentEventProxyContract.md)
- [DeploymentEventStandardContract](interfaces/DeploymentEventStandardContract.md)
- [DeploymentEventTransaction](interfaces/DeploymentEventTransaction.md)
- [LSP3Profile](interfaces/LSP3Profile.md)
- [LSP3ProfileImage](interfaces/LSP3ProfileImage.md)
- [LSP3ProfileJSON](interfaces/LSP3ProfileJSON.md)
- [LSP3ProfileLink](interfaces/LSP3ProfileLink.md)
- [LSPFactoryOptions](interfaces/LSPFactoryOptions.md)
- [ProfileDataBeforeUpload](interfaces/ProfileDataBeforeUpload.md)
- [ProfileDeploymentOptions](interfaces/ProfileDeploymentOptions.md)

### Type aliases

- [DeploymentEvent](README.md#deploymentevent)
- [DeploymentEvent$](README.md#deploymentevent$)
- [DeploymentEventContract](README.md#deploymenteventcontract)

## Type aliases

### DeploymentEvent

Ƭ **DeploymentEvent**: [`DeploymentEventStandardContract`](interfaces/DeploymentEventStandardContract.md) \| [`DeploymentEventProxyContract`](interfaces/DeploymentEventProxyContract.md) \| [`DeploymentEventTransaction`](interfaces/DeploymentEventTransaction.md)

#### Defined in

[lib/interfaces/deployment-events.ts:47](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/deployment-events.ts#L47)

___

### DeploymentEvent$

Ƭ **DeploymentEvent$**: `Observable`<[`DeploymentEvent`](README.md#deploymentevent)\>

#### Defined in

[lib/interfaces/deployment-events.ts:52](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/deployment-events.ts#L52)

___

### DeploymentEventContract

Ƭ **DeploymentEventContract**: [`DeploymentEventStandardContract`](interfaces/DeploymentEventStandardContract.md) \| [`DeploymentEventProxyContract`](interfaces/DeploymentEventProxyContract.md)

#### Defined in

[lib/interfaces/deployment-events.ts:37](https://github.com/lukso-network/tools-lsp-factory/blob/eccea2c/src/lib/interfaces/deployment-events.ts#L37)
