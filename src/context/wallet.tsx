"use client";

import React, { createContext, useContext } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bsc, mainnet, type AppKitNetwork } from "@reown/appkit/networks";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Reown AppKit is EVM-oriented; invoice networks like Tron are tracked as
// metadata on the invoice itself (see /api/invoices) and verified by hash format.
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bsc, mainnet];

let wagmiAdapter: WagmiAdapter | null = null;

// Guard: AppKit touches browser globals, so only initialise on the client.
if (typeof window !== "undefined" && projectId) {
  wagmiAdapter = new WagmiAdapter({ networks, projectId, ssr: true });
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata: {
      name: "BitSwap",
      description: "BitSwap — simple USDT invoice payments",
      url: window.location.origin,
      icons: ["https://avatars.githubusercontent.com/u/179229932"],
    },
    features: { analytics: true },
  });
}

const queryClient = new QueryClient();
const WalletReadyContext = createContext<boolean>(false);

/** True when a WalletConnect project ID is configured and AppKit is live. */
export function useWalletReady() {
  return useContext(WalletReadyContext);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const ready = wagmiAdapter !== null;
  const content = (
    <WalletReadyContext.Provider value={ready}>
      {children}
    </WalletReadyContext.Provider>
  );
  if (!ready) return content;
  return (
    <WagmiProvider config={wagmiAdapter!.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
    </WagmiProvider>
  );
}
