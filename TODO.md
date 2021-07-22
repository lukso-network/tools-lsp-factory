# Todos

- Write Docs
- Publish the abis from the contracts within `universalprofile-smart-contracts`
  - Use the `KeyManager` from the 'permissions' branch
- Investigate on how to apply EIP-1167 properly
- Decide on how and where to store the `versions`

  - proposed structure:
    ```json
    {
      "LSP3UniversalProfile": {
        "0.0.1": {
          "ERC725Account": "0x...",
          "KeyManager": "0x...",
          "UniversalReceiverDelegate": "0x..."
        }
      },
      "LSP4DigitalCertificate": {
        "0.0.1": {}
      }
    }
    ```

- Write more tests
