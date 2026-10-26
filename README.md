# Send USDT — Real On-Chain Transfer Panel

A standalone single-page panel for sending **real USDT** from your own wallet.
You connect your own wallet and sign a real on-chain transfer of your own USDT.
Nothing custodial, no private keys ever touch the app, no backend holds funds.

Built completely fresh (Next.js 14 App Router + TypeScript + Tailwind). No code
from any other project is reused here.

## Networks

| Network | Token | Contract / mint | Gas token | Typical fee |
|---|---|---|---|---|
| Ethereum (ERC-20) | USDT (Tether USD) | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | ETH | ~$2–$10 |
| BNB Chain (BEP-20) | **USDT (Binance-Peg)** | `0x55d398326f99059fF775485246999027B3197955` | BNB | ~$0.10 |
| Tron (TRC-20) | USDT | `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` | TRX | ~$0–$1 |
| Solana (SPL) | USDT mint | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | SOL | <$0.001 |

Addresses verified 2026-10-26 against Tether's official supported-protocols page
and each chain's official explorer (Etherscan / BscScan / Tronscan / Solana Explorer).

**Two facts the code is built around:**

1. **BNB Chain USDT uses 18 decimals, not 6.** The app calls `decimals()` on-chain
   for every network at send time and never hardcodes 6 for BSC (hardcoding 6
   would mis-price by 10¹²).
2. **BNB Chain USDT is Binance-Peg USDT** — issued by Binance, not by Tether
   (Tether publishes no USDT contract for BSC). The UI labels it
   "USDT (Binance-Peg)" and never claims it is Tether-issued.

Ethereum USDT's `transfer()` returns no boolean — the EVM send uses raw calldata
(no return value decoded) and trusts the transaction receipt status.

## What the panel does

- **Amount (USDT)** with a live USDT/USD rate (CoinGecko, server-side, 60 s cache,
  parity fallback with a "Cached" indicator).
- **Network selector** — Ethereum, BNB Chain, Tron, Solana — each showing its
  official contract/mint address.
- **Recipient address**, validated per network (EVM `0x` + EIP-55 checksum,
  Tron `T…` Base58Check 34 chars, Solana Base58 decoding to 32 bytes).
  Wrong-network addresses are rejected, self-sends are blocked, and the token
  contract address can never be a recipient.
- **Request expiry (10 / 30 / 60 / 90 days)** with honest semantics: the expiry
  is a countdown on the *payment request* — an expired request cannot be sent.
  Real USDT never expires, and the UI says so.
- **Wallet connect** — Reown AppKit + wagmi (EVM), TronLink adapter (Tron),
  Solana wallet adapter (Phantom / Solflare). After sending: the real tx hash +
  explorer link + live confirmation status, and a local send history
  (localStorage, this device only).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## Tim's steps before the first real send

1. **WalletConnect project ID (~5 min, free)** — EVM connections need it:
   https://cloud.reown.com → sign in → Projects → Create Project →
   name it `Send USDT Panel` → product **AppKit** → framework **Next.js** →
   copy the Project ID. Put it in `.env.local` as
   `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<id>` and in
   Vercel → Project → Settings → Environment Variables (Production + Preview),
   then redeploy. Without it, the EVM Connect button shows this notice instead
   of the modal; Tron and Solana still work.
2. **Keep fee-token balances** in the sending wallet: some ETH, BNB, ~15 TRX,
   ~0.01 SOL. A send fails without gas even if your USDT balance is fine.
3. **Test with tiny amounts first** (e.g. 1 USDT) on each network and verify
   each transaction on its explorer (Etherscan / BscScan / Tronscan / Solscan)
   before sending real amounts.
4. **Never share a seed phrase or private key** with anyone. This app never
   asks for one — if anything ever does, it is a scam.

## Env vars

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID for EVM connections (public client ID, not a secret) |

No other env vars. No private keys, no seed phrases, no server secrets.

## Tech

- Next.js 14.2.5 (App Router), React 18, TypeScript, Tailwind CSS 3.4
- `@reown/appkit` 1.8.24 + `wagmi` 3.7.9 + `viem` 2.57.11 (EVM)
- `tronweb` 6.5.1 + `@tronweb3/tronwallet-adapter-tronlink` 1.3.0 (Tron)
- `@solana/web3.js` 1.99.0 (v1 line) + `@solana/spl-token` 0.4.15 +
  `@solana/wallet-adapter-react` 0.15.40 (Solana)
