import type { PublicClient, WalletClient } from 'viem';

export interface LSPFactoryOptions {
  publicClient: PublicClient;
  walletClient: WalletClient;
  chainId: number;
}
