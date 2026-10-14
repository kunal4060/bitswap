import { NextRequest, NextResponse } from "next/server";
import { getDb, InvoiceRow } from "@/lib/db";
import { getNetwork, looksLikeTxHash } from "@/lib/networks";

interface RpcReceipt {
  status?: string;
  from?: string;
  to?: string;
  blockNumber?: string;
}

/** Verify an EVM transaction receipt via a public JSON-RPC endpoint. */
async function fetchReceipt(rpcUrl: string, txid: string): Promise<RpcReceipt | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [txid],
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.result as RpcReceipt | null) ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM invoices WHERE id = ?").get(params.id) as
    | InvoiceRow
    | undefined;
  if (!row) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (row.status === "confirmed") {
    return NextResponse.json({ status: "confirmed", txid: row.txid });
  }

  let body: { txid?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const txid = String(body.txid ?? "").trim();
  if (!looksLikeTxHash(txid)) {
    return NextResponse.json(
      { error: "Invalid transaction hash format. Expected 0x + 64 hex characters." },
      { status: 422 }
    );
  }

  const network = getNetwork(row.network);

  // On-chain verification where we have a public RPC (BSC).
  if (network?.rpcUrl) {
    const receipt = await fetchReceipt(network.rpcUrl, txid);
    if (!receipt) {
      return NextResponse.json(
        {
          error:
            "Transaction not found on the network yet. It may still be pending — wait for confirmations and try again.",
        },
        { status: 422 }
      );
    }
    const ok = receipt.status === "0x1" || receipt.status === "1";
    if (!ok) {
      return NextResponse.json(
        { error: "Transaction exists but failed on-chain (receipt status != success)." },
        { status: 422 }
      );
    }
    db.prepare(
      `UPDATE invoices SET status = 'confirmed', txid = ?, source_address = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(txid, receipt.from ?? null, row.id);
    return NextResponse.json({
      status: "confirmed",
      txid,
      sourceAddress: receipt.from ?? null,
    });
  }

  // Networks without a bundled public RPC: accept a well-formed hash and mark as confirming.
  db.prepare(
    `UPDATE invoices SET status = 'confirming', txid = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(txid, row.id);
  return NextResponse.json({
    status: "confirming",
    txid,
    note: `No public RPC bundled for ${network?.name ?? row.network}; hash format accepted and queued for manual review.`,
  });
}
