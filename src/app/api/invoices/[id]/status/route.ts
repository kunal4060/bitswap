import { NextRequest, NextResponse } from "next/server";
import { getDb, InvoiceRow } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const row = db
    .prepare("SELECT status, txid, source_address, updated_at FROM invoices WHERE id = ?")
    .get(params.id) as
    | Pick<InvoiceRow, "status" | "txid" | "source_address" | "updated_at">
    | undefined;
  if (!row) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  return NextResponse.json({
    status: row.status,
    txid: row.txid,
    sourceAddress: row.source_address,
    updatedAt: row.updated_at,
  });
}
