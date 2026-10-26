// EVM wallet setup — Reown AppKit + wagmi v3 + viem.
// AppKit is created ONLY when a WalletConnect project ID is configured
// (env var NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID). Without it, the EVM
// connect button shows a notice instead of the modal — Tron and Solana
// do not need this ID and keep working.

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, bsc } from "@reown/appkit/networks";
import { http } from "wagmi";
import { NETWORKS } from "./networks";

export const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId: PROJECT_ID || "missing-project-id",
  networks: [bsc, mainnet],
  transports: {
    [mainnet.id]: http(NETWORKS.ethereum.rpc),
    [bsc.id]: http(NETWORKS.bsc.rpc),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

let appKitInitialised = false;

/** Create the AppKit modal (client-side only, once). No-op without a project ID. */
export function initAppKit(): boolean {
  if (typeof window === "undefined") return false;
  if (appKitInitialised) return true;
  if (!PROJECT_ID) return false;
  try {
    createAppKit({
      adapters: [wagmiAdapter],
      networks: [bsc, mainnet],
      projectId: PROJECT_ID,
      metadata: {
        name: "Send USDT",
        description:
          "Send your own USDT on-chain — Ethereum, BNB Chain, Tron or Solana.",
        url: "https://send-usdt.vercel.app",
        icons: [],
      },
      features: { analytics: false },
    });
  } catch {
    return false;
  }
  appKitInitialised = true;
  return true;
}

// Standard Reown pattern: create AppKit at module scope so the modal exists
// before any component calls useAppKit (including during SSR/prerender).
// Skipped entirely when no project ID is configured.
if (PROJECT_ID) {
  initAppKit();
}

export function isAppKitConfigured(): boolean {
  return Boolean(PROJECT_ID);
}
