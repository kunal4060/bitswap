export interface NetworkInfo {
  id: string;
  name: string;
  short: string;
  symbol: string;
  // Public JSON-RPC endpoint used for on-chain receipt verification (null = format-only check)
  rpcUrl: string | null;
}

export const NETWORKS: NetworkInfo[] = [
  {
    id: "bsc",
    name: "BNB Smart Chain (BEP-20)",
    short: "BSC",
    symbol: "BNB",
    rpcUrl: "https://bsc-dataseed.binance.org",
  },
  {
    id: "ethereum",
    name: "Ethereum (ERC-20)",
    short: "ETH",
    symbol: "ETH",
    rpcUrl: null,
  },
  {
    id: "tron",
    name: "Tron (TRC-20)",
    short: "TRX",
    symbol: "TRX",
    rpcUrl: null,
  },
];

export function getNetwork(id: string): NetworkInfo | undefined {
  return NETWORKS.find((n) => n.id === id);
}

/** Loose tx hash format check: 0x + 64 hex chars (EVM style). */
export function looksLikeTxHash(txid: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(txid.trim());
}
