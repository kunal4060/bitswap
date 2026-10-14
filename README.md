# BitSwap — USDT Invoice Payments

A full-stack demo for creating and paying USDT invoices, styled like a modern
crypto payment page. Built with **Next.js 14 (App Router) + TypeScript +
Tailwind CSS**, **better-sqlite3** for storage, live USDT rates from CoinGecko,
on-chain TXID verification on BNB Smart Chain, and wallet connections via the
official **Reown AppKit (WalletConnect)** SDK.

> We never ask for seed phrases or private keys. Wallets connect only through
> the official Reown AppKit modal.

## Features

- **Create invoice** (`/`) — amount in USDT, network picker (BNB Smart Chain
  BEP-20, Ethereum ERC-20, Tron TRC-20), optional label → shareable invoice link.
- **Invoice page** (`/invoice/[id]`) — purple amount card, live USDT/USD rate
  (CoinGecko, 30s refresh), expandable transfer details, invoice status pill
  polled every 10s, copy-invoice-number with toast.
- **Wallet connect** — real Reown AppKit modal (QR on mobile, wallet list on
  desktop). Shows the truncated connected address once linked. If no
  WalletConnect project ID is configured, a friendly setup notice appears
  instead of crashing.
- **TXID verification** — payer pastes the transaction hash; the backend checks
  `eth_getTransactionReceipt` on BSC's public RPC and flips the invoice to
  `confirmed`. Non-BSC networks get a format check + `confirming` status.
- **Support chat widget** — floating teal button, canned bot answers for
  status / wallet / refund / network / fee questions.
- **SQLite storage** — `data/bitswap.db`, auto-created and migrated on first
  boot. No external database needed.

## API

| Method | Route | Description |
|---|---|---|
| POST | `/api/invoices` | `{amount, network, label?}` → creates invoice (`INV-XXXXXXXX`) |
| GET | `/api/invoices/[id]` | Full invoice JSON |
| GET | `/api/invoices/[id]/status` | `{status, txid, sourceAddress}` — polled by the page |
| POST | `/api/invoices/[id]/txid` | `{txid}` → on-chain verification |
| GET | `/api/rates` | `{usdtUsd, live}` — CoinGecko, 60s server cache, 1.00 fallback |
| POST | `/api/support/messages` | `{text}` → canned bot reply |

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your project ID
npm run dev                  # http://localhost:3000
```

### Environment variables

| Var | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | No (recommended) | Free project ID from https://cloud.reown.com. Without it, wallet connect shows a setup notice. |
| `BITSWAP_DB_PATH` | No | Override SQLite path. Defaults to `./data/bitswap.db`. |

### Production build

```bash
npm run build
npm start
```

## Deploy notes (Render)

1. Push this repo to GitHub.
2. On Render, create a **Web Service** from the repo:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Environment: `Node 20+`, add `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
3. **Persistence caveat:** Render's filesystem is ephemeral — `data/bitswap.db`
   will be wiped on every redeploy/restart unless you attach a **Render Disk**
   and set `BITSWAP_DB_PATH=/var/data/bitswap.db` (mount path of the disk).
   For serious use, swap better-sqlite3 for Postgres.

## Project structure

```
src/
  app/
    page.tsx                 # landing + create-invoice form
    invoice/[id]/page.tsx    # invoice detail page (live polling)
    api/
      invoices/route.ts              # POST create
      invoices/[id]/route.ts         # GET invoice
      invoices/[id]/status/route.ts  # GET status (poll)
      invoices/[id]/txid/route.ts    # POST verify TXID
      rates/route.ts                 # GET USDT/USD
      support/messages/route.ts      # POST bot reply
  components/
    WalletConnectButton.tsx  # AppKit open() + not-configured notice
    TxidForm.tsx             # TXID submit + verification UI
    SupportChat.tsx          # floating support widget
  context/wallet.tsx         # Reown AppKit provider (client-only init)
  lib/
    db.ts                    # better-sqlite3 singleton + migration
    networks.ts              # network metadata + txid format check
    rates.ts                 # CoinGecko rate with cache + fallback
```

## Disclaimer

Demo project. Invoice status is a convenience display and **does not replace
a blockchain TXID** — always verify transfers in a block explorer.
