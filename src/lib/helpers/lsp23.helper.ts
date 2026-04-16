import { ERC725 } from '@erc725/erc725.js';
import { ALL_PERMISSIONS, ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import {
  encodeFunctionData,
  getAddress,
  Hex,
  PublicClient,
  toHex,
  WalletClient,
  zeroAddress,
} from 'viem';

import { ControllerOptions } from '../interfaces/profile-deployment';

// --- ABIs ---

export const LSP23_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'salt', type: 'bytes32' },
          { name: 'fundingAmount', type: 'uint256' },
          { name: 'implementationContract', type: 'address' },
          { name: 'initializationCalldata', type: 'bytes' },
        ],
        name: 'primaryContractDeploymentInit',
        type: 'tuple',
      },
      {
        components: [
          { name: 'fundingAmount', type: 'uint256' },
          { name: 'implementationContract', type: 'address' },
          { name: 'initializationCalldata', type: 'bytes' },
          { name: 'addPrimaryContractAddress', type: 'bool' },
          { name: 'extraInitializationParams', type: 'bytes' },
        ],
        name: 'secondaryContractDeploymentInit',
        type: 'tuple',
      },
      { name: 'postDeploymentModule', type: 'address' },
      { name: 'postDeploymentModuleCalldata', type: 'bytes' },
    ],
    name: 'deployERC1167Proxies',
    outputs: [
      { name: 'primaryContractAddress', type: 'address' },
      { name: 'secondaryContractAddress', type: 'address' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'salt', type: 'bytes32' },
          { name: 'fundingAmount', type: 'uint256' },
          { name: 'implementationContract', type: 'address' },
          { name: 'initializationCalldata', type: 'bytes' },
        ],
        name: 'primaryContractDeploymentInit',
        type: 'tuple',
      },
      {
        components: [
          { name: 'fundingAmount', type: 'uint256' },
          { name: 'implementationContract', type: 'address' },
          { name: 'initializationCalldata', type: 'bytes' },
          { name: 'addPrimaryContractAddress', type: 'bool' },
          { name: 'extraInitializationParams', type: 'bytes' },
        ],
        name: 'secondaryContractDeploymentInit',
        type: 'tuple',
      },
      { name: 'postDeploymentModule', type: 'address' },
      { name: 'postDeploymentModuleCalldata', type: 'bytes' },
    ],
    name: 'computeERC1167Addresses',
    outputs: [
      { name: 'primaryContractAddress', type: 'address' },
      { name: 'secondaryContractAddress', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const UP_INIT_ABI = [
  {
    inputs: [{ name: 'initialOwner', type: 'address' }],
    name: 'initialize',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

export const KM_INIT_ABI = [
  {
    inputs: [{ name: 'target_', type: 'address' }],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const UP_ABI = [
  {
    inputs: [
      { name: 'dataKeys', type: 'bytes32[]' },
      { name: 'dataValues', type: 'bytes[]' },
    ],
    name: 'setDataBatch',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'dataKey', type: 'bytes32' },
      { name: 'dataValue', type: 'bytes' },
    ],
    name: 'setData',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const KM_ABI = [
  {
    inputs: [{ name: 'payload', type: 'bytes' }],
    name: 'execute',
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

// --- Helpers ---

export interface LSP23DeployParams {
  salt: Hex;
  upBaseContractAddress: Hex;
  kmBaseContractAddress: Hex;
  lsp23FactoryAddress: Hex;
  upInitOwner: Hex;
}

export function buildLSP23Args(params: LSP23DeployParams) {
  const upInitCalldata = encodeFunctionData({
    abi: UP_INIT_ABI,
    functionName: 'initialize',
    args: [params.upInitOwner],
  });

  const kmInitCalldata = encodeFunctionData({
    abi: KM_INIT_ABI,
    functionName: 'initialize',
    args: [zeroAddress], // placeholder; LSP23 appends UP address via addPrimaryContractAddress
  });

  const primaryContractDeploymentInit = {
    salt: params.salt,
    fundingAmount: 0n,
    implementationContract: params.upBaseContractAddress,
    initializationCalldata: upInitCalldata,
  };

  const secondaryContractDeploymentInit = {
    fundingAmount: 0n,
    implementationContract: params.kmBaseContractAddress,
    initializationCalldata: kmInitCalldata,
    addPrimaryContractAddress: true,
    extraInitializationParams: '0x' as Hex,
  };

  return {
    primaryContractDeploymentInit,
    secondaryContractDeploymentInit,
    postDeploymentModule: zeroAddress,
    postDeploymentModuleCalldata: '0x' as Hex,
  };
}

export async function deployViaLSP23(
  publicClient: PublicClient,
  walletClient: WalletClient,
  params: LSP23DeployParams,
): Promise<{ upAddress: Hex; kmAddress: Hex; txHash: Hex }> {
  const args = buildLSP23Args(params);

  const account = walletClient.account;
  if (!account) throw new Error('WalletClient must have an account');

  const { result, request } = await publicClient.simulateContract({
    address: params.lsp23FactoryAddress,
    abi: LSP23_ABI,
    functionName: 'deployERC1167Proxies',
    args: [
      args.primaryContractDeploymentInit,
      args.secondaryContractDeploymentInit,
      args.postDeploymentModule,
      args.postDeploymentModuleCalldata,
    ],
    account,
  });

  const txHash = await walletClient.writeContract(request);

  return {
    upAddress: getAddress(result[0]) as Hex,
    kmAddress: getAddress(result[1]) as Hex,
    txHash,
  };
}

export async function computeAddressesViaLSP23(
  publicClient: PublicClient,
  params: LSP23DeployParams,
): Promise<{ upAddress: Hex; kmAddress: Hex }> {
  const args = buildLSP23Args(params);

  const result = await publicClient.readContract({
    address: params.lsp23FactoryAddress,
    abi: LSP23_ABI,
    functionName: 'computeERC1167Addresses',
    args: [
      args.primaryContractDeploymentInit,
      args.secondaryContractDeploymentInit,
      args.postDeploymentModule,
      args.postDeploymentModuleCalldata,
    ],
  } as any);

  return {
    upAddress: getAddress(result[0]) as Hex,
    kmAddress: getAddress(result[1]) as Hex,
  };
}

/**
 * Build the data keys and values for setting controller permissions,
 * URD address, and optional LSP3 data on a Universal Profile.
 */
export function buildSetDataParams(
  controllers: (Hex | ControllerOptions)[],
  universalReceiverDelegateAddress: Hex,
  signerAddress: Hex,
  lsp3DataValue?: Hex,
): { keysToSet: Hex[]; valuesToSet: Hex[] } {
  const controllerAddresses: Hex[] = [];
  const controllerPermissions: Hex[] = [];

  controllers.forEach((controller, index) => {
    if (typeof controller === 'string') {
      controllerAddresses[index] = controller;
      controllerPermissions[index] = ALL_PERMISSIONS as Hex;
    } else {
      controllerAddresses[index] = controller.address;
      controllerPermissions[index] = controller.permissions ?? (ALL_PERMISSIONS as Hex);
    }
  });

  // AddressPermissions:Permissions:<address> keys
  const addressPermissionsKeys: Hex[] = controllerAddresses.map(
    (address) =>
      (ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + address.substring(2)) as Hex,
  );

  // AddressPermissions[index] keys
  const addressPermissionsArrayElements: Hex[] = controllerAddresses.map((_, index) => {
    const hexIndex = toHex(index, { size: 16 });
    return (ERC725YDataKeys.LSP6['AddressPermissions[]'].index + hexIndex.substring(2)) as Hex;
  });

  // URD permission index
  const urdIndex = toHex(controllerAddresses.length, { size: 16 });
  const universalReceiverPermissionIndex = (ERC725YDataKeys.LSP6['AddressPermissions[]'].index +
    urdIndex.substring(2)) as Hex;

  const keysToSet: Hex[] = [
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate as Hex,
    (ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] +
      universalReceiverDelegateAddress.substring(2)) as Hex,
    ERC725YDataKeys.LSP6['AddressPermissions[]'].length as Hex,
    ...addressPermissionsArrayElements,
    ...addressPermissionsKeys,
    universalReceiverPermissionIndex,
  ];

  const valuesToSet: Hex[] = [
    universalReceiverDelegateAddress,
    ERC725.encodePermissions({ SUPER_SETDATA: true, REENTRANCY: true }) as Hex,
    toHex(controllerAddresses.length + 1, { size: 16 }),
    ...controllerAddresses,
    ...controllerPermissions,
    universalReceiverDelegateAddress,
  ];

  // Set CHANGEOWNER + EDITPERMISSIONS for deploy key (revoked after transfer)
  if (!controllerAddresses.includes(signerAddress)) {
    keysToSet.push(
      (ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + signerAddress.substring(2)) as Hex,
    );
    valuesToSet.push(ERC725.encodePermissions({ CHANGEOWNER: true, EDITPERMISSIONS: true }) as Hex);
  } else {
    const signerKeyIndex = keysToSet.indexOf(
      (ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + signerAddress.substring(2)) as Hex,
    );
    if (signerKeyIndex >= 0) {
      valuesToSet[signerKeyIndex] = ERC725.encodePermissions({
        CHANGEOWNER: true,
        EDITPERMISSIONS: true,
      }) as Hex;
    }
  }

  if (lsp3DataValue) {
    keysToSet.push(ERC725YDataKeys.LSP3.LSP3Profile as Hex);
    valuesToSet.push(lsp3DataValue);
  }

  return { keysToSet, valuesToSet };
}

/**
 * Execute setDataBatch on the UP, then transfer ownership to KeyManager,
 * accept ownership, and revoke signer permissions.
 */
export async function setDataAndTransferOwnership(
  publicClient: PublicClient,
  walletClient: WalletClient,
  upAddress: Hex,
  kmAddress: Hex,
  controllers: (Hex | ControllerOptions)[],
  universalReceiverDelegateAddress: Hex,
  lsp3DataValue?: Hex,
): Promise<Hex[]> {
  const account = walletClient.account;
  if (!account) throw new Error('WalletClient must have an account');

  const signerAddress = getAddress(account.address) as Hex;
  const { keysToSet, valuesToSet } = buildSetDataParams(
    controllers,
    universalReceiverDelegateAddress,
    signerAddress,
    lsp3DataValue,
  );

  const txHashes: Hex[] = [];

  // 1. setDataBatch
  const setDataHash = await walletClient.writeContract({
    address: upAddress,
    abi: UP_ABI,
    functionName: 'setDataBatch',
    args: [keysToSet, valuesToSet],
    account,
    chain: walletClient.chain,
  });
  txHashes.push(setDataHash);
  await publicClient.waitForTransactionReceipt({ hash: setDataHash });

  // 2. transferOwnership to KeyManager
  const transferHash = await walletClient.writeContract({
    address: upAddress,
    abi: UP_ABI,
    functionName: 'transferOwnership',
    args: [kmAddress],
    account,
    chain: walletClient.chain,
  });
  txHashes.push(transferHash);
  await publicClient.waitForTransactionReceipt({ hash: transferHash });

  // 3. acceptOwnership via KeyManager
  const acceptOwnershipPayload = encodeFunctionData({
    abi: UP_ABI,
    functionName: 'acceptOwnership',
  });

  const acceptHash = await walletClient.writeContract({
    address: kmAddress,
    abi: KM_ABI,
    functionName: 'execute',
    args: [acceptOwnershipPayload],
    account,
    chain: walletClient.chain,
  });
  txHashes.push(acceptHash);
  await publicClient.waitForTransactionReceipt({ hash: acceptHash });

  // 4. Revoke signer permissions (set to final permission or empty)
  const controllerAddressList = controllers.map((c) => (typeof c === 'string' ? c : c.address));

  let signerPermission: Hex;
  if (controllerAddressList.includes(signerAddress)) {
    const controller = controllers[controllerAddressList.indexOf(signerAddress)];
    signerPermission =
      typeof controller === 'string'
        ? (ALL_PERMISSIONS as Hex)
        : (controller.permissions ?? (ALL_PERMISSIONS as Hex));
  } else {
    signerPermission = ERC725.encodePermissions({}) as Hex;
  }

  const revokePayload = encodeFunctionData({
    abi: UP_ABI,
    functionName: 'setData',
    args: [
      (ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + signerAddress.substring(2)) as Hex,
      signerPermission,
    ],
  });

  const revokeHash = await walletClient.writeContract({
    address: kmAddress,
    abi: KM_ABI,
    functionName: 'execute',
    args: [revokePayload],
    account,
    chain: walletClient.chain,
  });
  txHashes.push(revokeHash);
  await publicClient.waitForTransactionReceipt({ hash: revokeHash });

  return txHashes;
}
