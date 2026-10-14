import { NextRequest, NextResponse } from "next/server";

interface Rule {
  keywords: string[];
  reply: string;
}

const RULES: Rule[] = [
  {
    keywords: ["status", "confirm", "pending", "processing", "done", "complete"],
    reply:
      "You can check your invoice status live on this page — the status pill updates automatically. 'Processing' means we're waiting for your transfer. Once your transaction is confirmed on the blockchain, it flips to 'Confirmed'. You can also paste your transaction hash (TXID) to verify it instantly.",
  },
  {
    keywords: ["wallet", "connect", "metamask", "trust", "rainbow", "qr"],
    reply:
      "Tap 'Connect wallet' and scan the QR code with your wallet app (MetaMask, Trust Wallet, Rainbow all work via WalletConnect). We never ask for your seed phrase or private keys — if anyone does, it's a scam. After connecting, send the exact USDT amount to complete your invoice.",
  },
  {
    keywords: ["refund"],
    reply:
      "Refunds are handled case by case. If you sent funds to the wrong network or need a refund, reply here with your invoice number (INV-XXXXXXXX) and transaction hash, and our team will review it. Note: blockchain transfers are irreversible, so refunds depend on recoverability of the funds.",
  },
  {
    keywords: ["network", "bsc", "bnb", "ethereum", "erc", "tron", "trc", "bep"],
    reply:
      "This invoice supports BNB Smart Chain (BEP-20), Ethereum (ERC-20), and Tron (TRC-20). Always send on the network shown in your invoice's Transfer Details — sending on the wrong network can result in lost funds. Each invoice page shows its exact network.",
  },
  {
    keywords: ["fee", "fees", "cost", "charge", "gas"],
    reply:
      "BitSwap doesn't add hidden fees to the invoice amount — you pay exactly what's shown. You will still need a small amount of the network's native token (BNB, ETH, or TRX) in your wallet to cover blockchain gas fees for the transfer itself.",
  },
  {
    keywords: ["how long", "time", "wait", "slow"],
    reply:
      "Most transfers confirm within a few minutes depending on network congestion. BNB Smart Chain is usually fastest (~seconds to a minute), Ethereum can take longer during busy periods. If your status stays 'Processing' for over 30 minutes, paste your TXID on the invoice page to force a re-check.",
  },
  {
    keywords: ["invoice", "create", "new"],
    reply:
      "To create a new invoice, go back to the home page, enter the USDT amount, pick a network, and hit 'Create invoice'. You'll get a fresh invoice link you can share with your payer instantly.",
  },
];

const FALLBACK =
  "Thanks for reaching out! I can help with invoice status, wallet connection, networks, fees, refunds, and confirmation times. Could you tell me a bit more about what you need — and if it's about a specific invoice, share the invoice number (INV-XXXXXXXX)?";

export async function POST(req: NextRequest) {
  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const text = String(body.text ?? "").trim().slice(0, 1000);
  if (!text) {
    return NextResponse.json({ error: "Message text is required" }, { status: 400 });
  }

  const lower = text.toLowerCase();
  const match = RULES.find((r) => r.keywords.some((k) => lower.includes(k)));
  return NextResponse.json({ reply: match ? match.reply : FALLBACK });
}
