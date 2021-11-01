/**
 * TBD
 */
export interface ContractOptions {
  version?: string; // version of the pre-deployed code to use
  libAddress?: {
    // use a custom address where the code is deployed, overwrites 'version'
    KeyManager: string;
    ERC725Account: string;
    UniversalReceiverDelegate: string;
  };
  byteCode?: {
    // add your own custom bytecode, overwrites 'version' and 'libAddress'
    KeyManager: string;
    ERC725Account: string;
    UniversalReceiverDelegate: string;
  };
}
