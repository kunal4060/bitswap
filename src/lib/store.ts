import { put, head } from "@vercel/blob";

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

// In-memory fallback (local dev without a Blob token, or cold-start safety net).
const mem = new Map<string, Invoice>();

function blobToken(): string | null {
  return process.env.BLOB_READ_WRITE_TOKEN ?? null;
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
    const meta = await head(blobPath(id), { token });
    const res = await fetch(meta.url);
    if (!res.ok) return null;
    return (await res.json()) as Invoice;
  } catch {
    return null;
  }
}

async function writeInvoice(inv: Invoice): Promise<void> {
  const token = blobToken();
  if (!token) {
    mem.set(inv.id, inv);
    return;
  }
  await put(blobPath(inv.id), JSON.stringify(inv), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    token,
  });
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
