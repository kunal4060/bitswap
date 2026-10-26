// Network definitions for the Send USDT panel.
//
// Contract addresses verified 2026-10-26 against Tether's official page
// (https://tether.to/en/supported-protocols/) and each chain's official
// explorer (Etherscan / BscScan / Tronscan / Solana Explorer).
// See research notes in ~/workspace/send-usdt-research/contracts.md
//
// IMPORTANT — BSC decimals: the BNB Chain token below is Binance-Peg USDT
// (contract BEP20USDT), which uses 18 decimals, NOT 6. Never hardcode 6.
// The app reads decimals() on-chain for every network at send time; the
// `decimals` values here are only documented fallbacks if that read fails.

export type NetworkId = "ethereum" | "bsc" | "tron" | "solana";

export interface NetworkDef {
  id: NetworkId;
  kind: "evm" | "tron" | "solana";
  label: string;
  short: string;
  standard: string;
  /** USDT contract address (EVM/Tron) or SPL mint (Solana). */
  tokenAddress: string;
  /** Human label for the token on this network. */
  tokenLabel: string;
  chainId?: number;
  explorerTx: (hash: string) => string;
  explorerAddress: (address: string) => string;
  gasToken: string;
  typicalFee: string;
  feeNote: string;
  /** Documented decimals — fallback only; live value comes from decimals(). */
  decimalsFallback: number;
  rpc: string;
}

export const NETWORKS: Record<NetworkId, NetworkDef> = {
  ethereum: {
    id: "ethereum",
    kind: "evm",
    label: "Ethereum",
    short: "ETH",
    standard: "ERC-20",
    tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    tokenLabel: "USDT (Tether USD)",
    chainId: 1,
    explorerTx: (h) => `https://etherscan.io/tx/${h}`,
    explorerAddress: (a) => `https://etherscan.io/address/${a}`,
    gasToken: "ETH",
    typicalFee: "~$2–$10",
    feeNote:
      "Ethereum gas varies with congestion. You pay the fee in ETH, not USDT.",
    decimalsFallback: 6,
    rpc: "https://eth.api.onfinality.io/public",
  },
  bsc: {
    id: "bsc",
    kind: "evm",
    label: "BNB Chain",
    short: "BSC",
    standard: "BEP-20",
    tokenAddress: "0x55d398326f99059fF775485246999027B3197955",
    tokenLabel: "USDT (Binance-Peg)",
    chainId: 56,
    explorerTx: (h) => `https://bscscan.com/tx/${h}`,
    explorerAddress: (a) => `https://bscscan.com/address/${a}`,
    gasToken: "BNB",
    typicalFee: "~$0.10",
    feeNote:
      "BNB Chain fees are low and predictable. You pay the fee in BNB, not USDT. This token is Binance-Peg USDT — issued by Binance, not by Tether.",
    decimalsFallback: 18,
    rpc: "https://bsc-dataseed.binance.org",
  },
  tron: {
    id: "tron",
    kind: "tron",
    label: "Tron",
    short: "TRX",
    standard: "TRC-20",
    tokenAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    tokenLabel: "USDT (TRC-20)",
    explorerTx: (h) => `https://tronscan.org/#/transaction/${h}`,
    explorerAddress: (a) => `https://tronscan.org/#/address/${a}`,
    gasToken: "TRX",
    typicalFee: "~$0–$1",
    feeNote:
      "Tron fees burn Energy/Bandwidth paid in TRX — roughly 6.5 TRX if the recipient already holds USDT, ~13 TRX if not. A USDT-only wallet cannot send.",
    decimalsFallback: 6,
    rpc: "https://api.trongrid.io",
  },
  solana: {
    id: "solana",
    kind: "solana",
    label: "Solana",
    short: "SOL",
    standard: "SPL",
    tokenAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    tokenLabel: "USDT (SPL mint)",
    explorerTx: (h) => `https://solscan.io/tx/${h}`,
    explorerAddress: (a) => `https://solscan.io/account/${a}`,
    gasToken: "SOL",
    typicalFee: "<$0.001",
    feeNote:
      "Cheapest per send. If the recipient has never held USDT, a one-time ~0.002 SOL rent creates their token account (paid by you).",
    decimalsFallback: 6,
    rpc: "https://api.mainnet-beta.solana.com",
  },
};

export const NETWORK_ORDER: NetworkId[] = [
  "bsc",
  "ethereum",
  "tron",
  "solana",
];

export const EXPIRY_OPTIONS = [10, 30, 60, 90] as const;

export const HISTORY_KEY = "send-usdt-history-v1";

export interface SendRecord {
  id: string;
  network: NetworkId;
  amount: string;
  recipient: string;
  sender: string;
  txHash: string;
  explorerUrl: string;
  status: "sent" | "confirmed" | "failed";
  createdAt: number;
  expiresAt: number;
}
