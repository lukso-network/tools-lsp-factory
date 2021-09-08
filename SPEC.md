# Deployment Events

```typescript
let deploymentEvents = [];

lspFactory.LSP3UniversalProfile
  .deploy(// ... omitted for brevity)
  .subscribe({
    next: (deploymentEvent: DeploymentEvent<any>) => {
      deploymenLogs.push(deploymentEvent);
    },
    complete: () => {
      console.log(deploymentEvents);
    },
  });
```

**console.log output**

```typescript
// prettier-ignore
[
  { type: 'CONTRACT_PROXY',  name: 'ERC725Account',        function: 'DEPLOY',            status: 'PENDING',  transaction:  {} },
  { type: "CONTRACT_PROXY",  name: 'ERC725Account',        function: 'DEPLOY',            status: 'PENDING',  receipt:      {} },
  { type: "CONTRACT_PROXY",  name: 'ERC725Account',        function: 'initialize',        status: 'PENDING',  transaction:  {} },
  { type: "CONTRACT_PROXY",  name: 'ERC725Account',        function: 'initialize',        status: 'COMPLETE', receipt:      {} },

  { type: 'CONTRACT',        name: 'KeyManager',           function: 'DEPLOY',            status: 'PENDING',  transaction:  {} },
  { type: "CONTRACT_PROXY",  name: 'UniversalReceiver...', function: 'DEPLOY',            status: 'PENDING',  transaction:  {} },
  { type: 'CONTRACT',        name: 'KeyManager',           function: 'DEPLOY',            status: 'COMPLETE', receipt:      {} },
  { type: "CONTRACT_PROXY",  name: 'UniversalReceiver...', function: 'DEPLOY',            status: 'PENDING',  receipt:      {} },
  { type: "CONTRACT_PROXY",  name: 'UniversalReceiver...', function: 'initialize',        status: 'PENDING',  transaction:  {} },
  { type: "CONTRACT_PROXY",  name: 'UniversalReceiver...', function: 'initialize',        status: 'COMPLETE', receipt:      {} },

  { type: 'TRANSACTION',     name: 'ERC725Account',        function: 'setDataMultiple',   status: 'PENDING',  transaction:  {} },
  { type: 'TRANSACTION',     name: 'ERC725Account',        function: 'setDataMultiple',   status: 'COMPLETE', receipt:      {} },

  { type: 'TRANSACTION',     name: 'ERC725Account',        function: 'transferOwnership', status: 'PENDING',  transaction:  {} },
  { type: 'TRANSACTION',     name: 'ERC725Account',        function: 'transferOwnership', status: 'COMPLETE', receipt:      {} },
];
```

## Questions

- When is a contract considered "deployed"?

  - `CONTRACT`: when receiving the `DEPLOY` receipt
  - `CONTRACT_PROXY`: when receiving the `initialize` receipt

- Once a contract is deployed, we can:

  - let people extract the contract address from the receipt
  - return the address explicitly

  ```typescript
     { type: "CONTRACT_PROXY",  name: 'ERC725Account',        function: 'initialize',         receipt:      {} , address:  {} },
  ```

  - return a fully working (**ethers.js**) `Contract` object.

  ```typescript
    { type: "CONTRACT_PROXY",  name: 'ERC725Account',        function: 'initialize',         receipt:      {} , contract:  {} },
  ```
