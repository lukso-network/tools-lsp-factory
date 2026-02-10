import { Hex, PublicClient, WalletClient, getAddress } from 'viem';

export function isAddress(testAddress: string): boolean {
  try {
    getAddress(testAddress);
    return true;
  } catch {
    return false;
  }
}

export function convertContractDeploymentOptionsVersion(providedVersion?: string) {
  let version: string | undefined;
  let byteCode: Hex | undefined;
  let libAddress: Hex | undefined;

  if (providedVersion && providedVersion.startsWith('0x')) {
    if (isAddress(providedVersion)) {
      libAddress = providedVersion as Hex;
    } else {
      byteCode = providedVersion as Hex;
    }
  } else if (providedVersion) {
    version = providedVersion;
  }

  return { version, byteCode, libAddress };
}

export async function getDeployedByteCode(
  contractAddress: Hex,
  publicClient: PublicClient
): Promise<Hex> {
  return publicClient.getCode({ address: contractAddress }) ?? '0x';
}

export function getProxyByteCode(address: Hex): Hex {
  return `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${address.slice(2)}5af43d82803e903d91602b57fd5bf3`;
}
