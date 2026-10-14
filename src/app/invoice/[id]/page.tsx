"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import WalletConnectButton from "@/components/WalletConnectButton";
import TxidForm from "@/components/TxidForm";
import SupportChat from "@/components/SupportChat";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  network: string;
  networkName: string;
  label: string | null;
  status: string;
  txid: string | null;
  sourceAddress: string | null;
  createdAt: string;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    processing: "bg-violet-100 text-violet-700",
    confirming: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
  };
  const labels: Record<string, string> = {
    processing: "Processing",
    confirming: "Confirming",
    confirmed: "Confirmed",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        styles[status] ?? styles.processing
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {labels[status] ?? status}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z");
  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1);
  const [rateLive, setRateLive] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchInvoice = useCallback(async () => {
    const res = await fetch(`/api/invoices/${id}`);
    if (res.status === 404) {
      setError("Invoice not found. Check the link and try again.");
      return;
    }
    const data = await res.json();
    setInvoice(data);
  }, [id]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/invoices/${id}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setInvoice((inv) =>
        inv ? { ...inv, status: data.status, txid: data.txid, sourceAddress: data.sourceAddress } : inv
      );
    } catch {
      /* polling is best-effort */
    }
  }, [id]);

  const fetchRate = useCallback(async () => {
    try {
      const res = await fetch("/api/rates");
      const data = await res.json();
      if (typeof data.usdtUsd === "number") {
        setRate(data.usdtUsd);
        setRateLive(!!data.live);
      }
    } catch {
      /* keep last known */
    }
  }, []);

  useEffect(() => {
    fetchInvoice();
    fetchRate();
  }, [fetchInvoice, fetchRate]);

  useEffect(() => {
    const t = setInterval(fetchStatus, 10_000);
    return () => clearInterval(t);
  }, [fetchStatus]);

  useEffect(() => {
    const t = setInterval(fetchRate, 30_000);
    return () => clearInterval(t);
  }, [fetchRate]);

  async function copyInvoiceNumber() {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(invoice.invoiceNumber);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = invoice.invoiceNumber;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f5fb] flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-sm">
          <div className="text-4xl mb-4">🧾</div>
          <h1 className="font-bold text-lg mb-2">Invoice not found</h1>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Link href="/" className="text-violet-600 font-semibold text-sm hover:underline">
            ← Create a new invoice
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#f6f5fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading invoice…</p>
        </div>
      </div>
    );
  }

  const usdValue = (invoice.amount * rate).toFixed(2);
  const details: [string, string][] = [
    ["Source", invoice.sourceAddress ?? "Will appear after TXID confirmation"],
    ["Amount", `${invoice.amount} ${invoice.currency}`],
    ["Network", invoice.networkName],
    ["Created", formatDate(invoice.createdAt)],
    ["Reference", invoice.invoiceNumber],
  ];

  return (
    <div className="min-h-screen bg-[#f6f5fb] text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">
            Bit<span className="text-violet-600">Swap</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-full px-3 py-1.5 bg-white">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Secure invoice
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 pb-24">
        {/* Title block */}
        <div className="flex items-start justify-between gap-4 mt-2 mb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-violet-600 uppercase mb-2">
              Incoming transfer
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight">Receiving {invoice.currency}</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Invoice <span className="font-mono font-semibold text-slate-700">{invoice.invoiceNumber}</span>
              {invoice.label && <span className="text-slate-400"> · {invoice.label}</span>}
            </p>
          </div>
          <StatusPill status={invoice.status} />
        </div>

        {/* Amount card */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-500 via-[#6d58f6] to-indigo-600 text-white p-6 sm:p-7 mb-4 relative overflow-hidden shadow-[0_20px_50px_-18px_rgba(109,88,246,0.6)]">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 w-24 h-24 rounded-full bg-white/10" />
          <div className="flex items-center justify-between mb-6 relative">
            <span className="text-sm text-white/80">You will receive</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-2.5 py-1 text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-extrabold text-white">T</span>
              {invoice.currency}
            </span>
          </div>
          <div className="relative">
            <span className="text-6xl font-extrabold tracking-tight">{invoice.amount}</span>
            <span className="text-xl font-bold text-white/85 ml-2">{invoice.currency}</span>
          </div>
          <div className="text-white/80 text-sm mt-1.5 relative">≈ {usdValue} USD</div>
        </div>

        {/* Market rate card */}
        <div className="rounded-2xl bg-white border border-slate-100 px-5 py-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">Current market rate</div>
            <div className="font-bold">
              1 {invoice.currency} = {rate.toFixed(2)} USD
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className={`w-2 h-2 rounded-full bg-emerald-500 ${rateLive ? "animate-ping" : ""}`} />
            Live
          </span>
        </div>

        {/* Transfer details */}
        <div className="rounded-2xl bg-white border border-slate-100 mb-4 overflow-hidden">
          <button
            onClick={() => setDetailsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-sm font-bold tracking-wide">
              TRANSFER DETAILS{" "}
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold">
                5
              </span>
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-slate-400 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {detailsOpen && (
            <div className="border-t border-slate-100">
              {details.map(([k, v], i) => (
                <div
                  key={k}
                  className={`flex items-center justify-between px-5 py-3.5 text-sm ${
                    i !== details.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <span className="text-slate-400">{k}</span>
                  <span className="font-semibold text-right max-w-[60%] break-all">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <WalletConnectButton />
          <button
            onClick={copyInvoiceNumber}
            className="flex-1 rounded-2xl border-2 border-slate-200 bg-white font-bold py-4 px-4 hover:border-violet-400 active:scale-[0.99] transition flex items-center justify-center gap-2 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            {copied ? "Copied!" : "Copy invoice number"}
          </button>
        </div>

        {/* TXID submission */}
        {invoice.status !== "confirmed" && (
          <TxidForm invoiceId={invoice.id} onConfirmed={() => fetchStatus()} />
        )}
        {invoice.status === "confirmed" && invoice.txid && (
          <div className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
            <div className="font-bold text-emerald-800 text-sm mb-1">✓ Payment confirmed</div>
            <div className="text-xs text-emerald-700 break-all font-mono">{invoice.txid}</div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 mb-3">
            Invoice status does not replace a blockchain TXID.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Private
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
              Verified request
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              Fast
            </span>
          </div>
        </div>
      </main>

      <SupportChat />
    </div>
  );
}
