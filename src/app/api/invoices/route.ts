import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb, rowToInvoice, InvoiceRow } from "@/lib/db";
import { getNetwork } from "@/lib/networks";

function makeInvoiceNumber(): string {
  // INV- + 8 digits
  const digits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `INV-${digits}`;
}

export async function POST(req: NextRequest) {
  let body: { amount?: unknown; network?: unknown; label?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }
  if (amount > 1_000_000_000) {
    return NextResponse.json({ error: "amount is unreasonably large" }, { status: 400 });
  }

  const networkId = String(body.network ?? "bsc");
  const network = getNetwork(networkId);
  if (!network) {
    return NextResponse.json({ error: "Unsupported network" }, { status: 400 });
  }

  const label =
    typeof body.label === "string" && body.label.trim().length > 0
      ? body.label.trim().slice(0, 140)
      : null;

  const db = getDb();
  const id = randomUUID();
  // Extremely unlikely collision; retry once on unique violation.
  let invoiceNumber = makeInvoiceNumber();
  const insert = () =>
    db
      .prepare(
        `INSERT INTO invoices (id, invoice_number, amount, currency, network, label, status)
         VALUES (?, ?, ?, 'USDT', ?, ?, 'processing')`
      )
      .run(id, invoiceNumber, amount, network.id, label);
  try {
    insert();
  } catch {
    invoiceNumber = makeInvoiceNumber();
    try {
      insert();
    } catch {
      return NextResponse.json({ error: "Could not create invoice, try again" }, { status: 500 });
    }
  }

  const row = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as InvoiceRow;
  const invoice = rowToInvoice(row);
  return NextResponse.json(
    {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      currency: invoice.currency,
      network: network.id,
      networkName: network.name,
      label: invoice.label,
      status: invoice.status,
      createdAt: invoice.createdAt,
    },
    { status: 201 }
  );
}
