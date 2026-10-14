import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

function getDbPath(): string {
  // Allow override via env (useful on hosts with persistent disks, e.g. Render Disk)
  if (process.env.BITSWAP_DB_PATH) return process.env.BITSWAP_DB_PATH;
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "bitswap.db");
}

export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(getDbPath());
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USDT',
      network TEXT NOT NULL,
      label TEXT,
      status TEXT NOT NULL DEFAULT 'processing',
      txid TEXT,
      source_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export interface InvoiceRow {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  network: string;
  label: string | null;
  status: string;
  txid: string | null;
  source_address: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToInvoice(r: InvoiceRow) {
  return {
    id: r.id,
    invoiceNumber: r.invoice_number,
    amount: r.amount,
    currency: r.currency,
    network: r.network,
    label: r.label,
    status: r.status,
    txid: r.txid,
    sourceAddress: r.source_address,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
