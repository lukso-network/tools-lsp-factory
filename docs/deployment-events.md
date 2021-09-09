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
  { type: 'PROXY',        contractName: 'ERC725Account',                                              status: 'PENDING',  transaction:  {} },
  { type: "PROXY",        contractName: 'ERC725Account',                                              status: 'PENDING',  receipt:      {} },
  { type: "PROXY",        contractName: 'ERC725Account',           functionName: 'initialize',        status: 'PENDING',  transaction:  {} },
  { type: "PROXY",        contractName: 'ERC725Account',           functionName: 'initialize',        status: 'COMPLETE', receipt:      {} },

  { type: 'CONTRACT',     contractName: 'KeyManager',                                                 status: 'PENDING',  transaction:  {} },
  { type: "PROXY",        contractName: 'UniversalReceiver...',                                       status: 'PENDING',  transaction:  {} },
  { type: 'CONTRACT',     contractName: 'KeyManager',                                                 status: 'COMPLETE', receipt:      {} },
  { type: "PROXY",        contractName: 'UniversalReceiver...',                                       status: 'PENDING',  receipt:      {} },
  { type: "PROXY",        contractName: 'UniversalReceiver...',    functionName: 'initialize',        status: 'PENDING',  transaction:  {} },
  { type: "PROXY",        contractName: 'UniversalReceiver...',    functionName: 'initialize',        status: 'COMPLETE', receipt:      {} },

  { type: 'TRANSACTION',  contractName: 'ERC725Account',           functionName: 'setDataMultiple',   status: 'PENDING',  transaction:  {} },
  { type: 'TRANSACTION',  contractName: 'ERC725Account',           functionName: 'setDataMultiple',   status: 'COMPLETE', receipt:      {} },

  { type: 'TRANSACTION',  contractName: 'ERC725Account',           functionName: 'transferOwnership', status: 'PENDING',  transaction:  {} },
  { type: 'TRANSACTION',  contractName: 'ERC725Account',           functionName: 'transferOwnership', status: 'COMPLETE', receipt:      {} },
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
     {
       type:          "CONTRACT_PROXY",
       contractName:  "ERC725Account",
       functionName:  "initialize",
       status:        'COMPLETE'
       receipt:       {} ,
       address:       "0x..." // <----
     },
  ```

  - return a fully working (**ethers.js**) `Contract` object.

  ```typescript
     {
       type:          "CONTRACT_PROXY",
       contractName:  "ERC725Account",
       functionName:  "initialize",
       status:        'COMPLETE'
       receipt:       {} ,
       contract:      {} // <----
     },
  ```
