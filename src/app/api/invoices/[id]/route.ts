import { NextRequest, NextResponse } from "next/server";
import { getInvoice } from "@/lib/store";
import { getNetwork } from "@/lib/networks";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const invoice = await getInvoice(params.id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  const network = getNetwork(invoice.network);
  return NextResponse.json({
    ...invoice,
    networkName: network?.name ?? invoice.network,
  });
}
