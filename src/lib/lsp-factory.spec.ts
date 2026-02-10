import { PublicClient, WalletClient } from 'viem';

import { LSPFactory } from './lsp-factory';
import { UniversalProfile } from './classes/universal-profile';
import { LSP7DigitalAsset } from './classes/lsp7-digital-asset';
import { LSP8IdentifiableDigitalAsset } from './classes/lsp8-identifiable-digital-asset';

describe('LSPFactory', () => {
  it('should create an instance with all sub-classes', () => {
    const publicClient = { chain: { id: 4201 } } as unknown as PublicClient;
    const walletClient = {} as unknown as WalletClient;

    const factory = new LSPFactory(publicClient, walletClient);

    expect(factory.UniversalProfile).toBeInstanceOf(UniversalProfile);
    expect(factory.LSP7DigitalAsset).toBeInstanceOf(LSP7DigitalAsset);
    expect(factory.LSP8IdentifiableDigitalAsset).toBeInstanceOf(LSP8IdentifiableDigitalAsset);
  });

  it('should default chainId to 4201 when chain is undefined', () => {
    const publicClient = { chain: undefined } as unknown as PublicClient;
    const walletClient = {} as unknown as WalletClient;

    const factory = new LSPFactory(publicClient, walletClient);

    expect(factory.options.chainId).toBe(4201);
  });

  it('should use the chain id from publicClient', () => {
    const publicClient = { chain: { id: 42 } } as unknown as PublicClient;
    const walletClient = {} as unknown as WalletClient;

    const factory = new LSPFactory(publicClient, walletClient);

    expect(factory.options.chainId).toBe(42);
  });

  it('should store publicClient and walletClient in options', () => {
    const publicClient = { chain: { id: 4201 } } as unknown as PublicClient;
    const walletClient = {} as unknown as WalletClient;

    const factory = new LSPFactory(publicClient, walletClient);

    expect(factory.options.publicClient).toBe(publicClient);
    expect(factory.options.walletClient).toBe(walletClient);
  });
});
