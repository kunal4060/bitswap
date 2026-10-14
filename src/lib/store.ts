import { put, list } from "@vercel/blob";

export type InvoiceStatus = "processing" | "confirming" | "confirmed";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  network: string;
  label: string | null;
  status: InvoiceStatus;
  txid: string | null;
  sourceAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback (local dev without a Blob token, or Blob outage safety net).
const mem = new Map<string, Invoice>();

function blobToken(): string | null {
  const t = (process.env.BLOB_READ_WRITE_TOKEN ?? "").trim();
  return t.length > 0 ? t : null;
}

function blobPath(id: string): string {
  return `invoices/${id}.json`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function readInvoice(id: string): Promise<Invoice | null> {
  const token = blobToken();
  if (!token) return mem.get(id) ?? null;
  try {
    // head() needs a full blob URL; list by exact prefix to resolve the URL.
    const { blobs } = await list({ prefix: blobPath(id), limit: 1, token });
    const blob = blobs[0];
    if (!blob) return mem.get(id) ?? null;
    const res = await fetch(blob.url);
    if (!res.ok) return null;
    return (await res.json()) as Invoice;
  } catch (err) {
    console.error("blob read failed, memory fallback:", err);
    return mem.get(id) ?? null;
  }
}

async function writeInvoice(inv: Invoice): Promise<void> {
  const token = blobToken();
  if (!token) {
    mem.set(inv.id, inv);
    return;
  }
  try {
    await put(blobPath(inv.id), JSON.stringify(inv), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      token,
    });
  } catch (err) {
    console.error("blob write failed, memory fallback:", err);
    mem.set(inv.id, inv);
  }
}

export async function createInvoice(data: {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  network: string;
  label: string | null;
}): Promise<Invoice> {
  const t = nowIso();
  const inv: Invoice = {
    ...data,
    status: "processing",
    txid: null,
    sourceAddress: null,
    createdAt: t,
    updatedAt: t,
  };
  await writeInvoice(inv);
  return inv;
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  return readInvoice(id);
}

export async function updateInvoice(
  id: string,
  patch: Partial<Pick<Invoice, "status" | "txid" | "sourceAddress">>
): Promise<Invoice | null> {
  const inv = await readInvoice(id);
  if (!inv) return null;
  const updated: Invoice = { ...inv, ...patch, updatedAt: nowIso() };
  await writeInvoice(updated);
  return updated;
}
