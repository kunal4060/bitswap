// Client-side wallet providers: wagmi (EVM) + Solana wallet adapter.
// TronLink is driven directly via its adapter (see src/lib/tron.ts) — it
// needs no React provider. AppKit (EVM modal) is initialised lazily on
// the client so a missing project ID never breaks the page.

"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import {
  ConnectionProvider as SolanaConnectionProviderBase,
  WalletProvider as SolanaWalletProviderBase,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider as SolanaWalletModalProviderBase } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { wagmiConfig, initAppKit } from "@/config/wallets";

import "@solana/wallet-adapter-react-ui/styles.css";

// @solana/wallet-adapter-react ships React 18-style FC types, which React 19's
// JSX checking rejects ("cannot be used as a JSX component"). These casts are
// type-only — the runtime components are unchanged.
const ConnectionProvider = SolanaConnectionProviderBase as unknown as ComponentType<{
  endpoint: string;
  children: ReactNode;
}>;
const SolanaWalletProvider = SolanaWalletProviderBase as unknown as ComponentType<{
  wallets: unknown[];
  autoConnect?: boolean;
  children: ReactNode;
}>;
const WalletModalProvider = SolanaWalletModalProviderBase as unknown as ComponentType<{
  children: ReactNode;
}>;

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const endpoint = useMemo(() => clusterApiUrl("mainnet-beta"), []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  useEffect(() => {
    initAppKit();
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <SolanaWalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>{children}</WalletModalProvider>
          </SolanaWalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
