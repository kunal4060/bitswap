import { NextRequest, NextResponse } from "next/server";
import { getDb, rowToInvoice, InvoiceRow } from "@/lib/db";
import { getNetwork } from "@/lib/networks";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM invoices WHERE id = ?").get(params.id) as
    | InvoiceRow
    | undefined;
  if (!row) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  const invoice = rowToInvoice(row);
  const network = getNetwork(invoice.network);
  return NextResponse.json({
    ...invoice,
    networkName: network?.name ?? invoice.network,
  });
}
