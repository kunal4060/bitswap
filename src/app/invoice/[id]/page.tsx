"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BootIntro from "@/components/BootIntro";
import Brandbar from "@/components/Brandbar";
import SupportChat from "@/components/SupportChat";
import TxidForm from "@/components/TxidForm";
import WalletConnectButton from "@/components/WalletConnectButton";
import { StatusPill, Toast, TrustRow, FloatingDecor, ChevronIcon } from "@/components/ui";

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

const REVEAL_EASE = "cubic-bezier(.2,.75,.2,1)";

export default function InvoicePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1);
  const [rateLive, setRateLive] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

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

  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2000);
  }

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
    showToast("Copied");
  }

  if (error) {
    return (
      <div className="bs-page-bg min-h-screen flex items-center justify-center px-6">
        <BootIntro />
        <div className="bs-glass rounded-[26px] p-10 text-center max-w-sm relative z-10">
          <h1 className="font-extrabold text-lg mb-2" style={{ color: "#11172c" }}>Invoice not found</h1>
          <p className="text-sm mb-6" style={{ color: "#8f93a8" }}>{error}</p>
          <Link href="/" className="text-sm font-bold" style={{ color: "#6851f0" }}>
            ← Create a new invoice
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bs-page-bg min-h-screen flex items-center justify-center">
        <BootIntro />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div
            className="w-12 h-12 rounded-full animate-spin"
            style={{ border: "4px solid #e9e5ff", borderTopColor: "#6851f0" }}
          />
          <p className="text-sm" style={{ color: "#8f93a8" }}>Loading invoice…</p>
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
    <div className="bs-page-bg min-h-screen" style={{ color: "#11172c" }}>
      <BootIntro />
      <FloatingDecor />

      <div className="relative z-10 mx-auto w-full max-w-[480px] px-5" style={{ paddingTop: 30, paddingBottom: 48 }}>
        <Brandbar />

        <main
          className="bs-glass bs-reveal-card rounded-[26px]"
          style={{ padding: 25, animationDuration: "0.85s", animationDelay: "1.62s" }}
        >
          {/* Head */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p style={{ fontSize: 11, fontWeight: 780, letterSpacing: "0.12em", color: "#6851f0" }}>
                INCOMING TRANSFER
              </p>
              <h1
                className="mt-1.5"
                style={{ fontSize: 26, fontWeight: 810, letterSpacing: "-0.045em", color: "#11172c" }}
              >
                Receiving <span style={{ color: "#6851f0" }}>{invoice.currency}</span>
              </h1>
              <p className="mt-1.5" style={{ fontSize: 12, color: "#8f93a8" }}>
                Invoice{" "}
                <span className="font-mono font-bold" style={{ color: "#343a52" }}>
                  {invoice.invoiceNumber}
                </span>
                {invoice.label && <span> · {invoice.label}</span>}
              </p>
            </div>
            <StatusPill status={invoice.status} />
          </div>

          <div className="my-5" style={{ borderTop: "1px solid rgba(75,62,177,0.1)" }} />

          {/* Amount card */}
          <p className="mb-2" style={{ fontSize: 10, fontWeight: 780, letterSpacing: "0.12em", color: "#8f93a8" }}>
            TRANSFER AMOUNT
          </p>
          <div
            className="bs-reveal bs-shine relative text-white"
            style={{
              minHeight: 151,
              padding: 22,
              borderRadius: 19,
              background: "linear-gradient(135deg, #8e7cff 0%, #6a51ef 58%, #5238d7 100%)",
              boxShadow: "0 18px 44px rgba(88,64,220,0.32)",
              animationDuration: "0.8s",
              animationDelay: "2.02s",
              animationTimingFunction: REVEAL_EASE,
            }}
          >
            <div className="bs-amount-glow" />
            <div className="bs-amount-ring" />
            <div className="relative flex items-center justify-between">
              <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
                You will receive
              </span>
              <span
                className="inline-flex items-center gap-1.5"
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  background: "rgba(255,255,255,0.16)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 9999,
                  padding: "5px 10px 5px 6px",
                }}
              >
                <span
                  className="flex items-center justify-center"
                  style={{ width: 18, height: 18, borderRadius: 9999, background: "#27ad83", fontSize: 11, fontWeight: 800 }}
                >
                  T
                </span>
                {invoice.currency}
              </span>
            </div>
            <div className="relative mt-3 flex items-baseline gap-2">
              <span style={{ fontSize: "clamp(38px, 11vw, 52px)", fontWeight: 830, letterSpacing: "-0.06em", lineHeight: 1 }}>
                {invoice.amount}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                {invoice.currency}
              </span>
            </div>
            <div className="relative mt-1.5" style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.73)" }}>
              ≈ {usdValue} USD
            </div>
          </div>

          {/* Rate card */}
          <div
            className="bs-reveal mt-3 flex items-center justify-between"
            style={{
              background: "#f7f6ffc7",
              border: "1px solid rgba(75,62,177,0.1)",
              borderRadius: 16,
              padding: "14px 18px",
              animationDuration: "0.8s",
              animationDelay: "2.16s",
              animationTimingFunction: REVEAL_EASE,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#8f93a8", fontWeight: 500 }}>Current market rate</div>
              <div className="mt-0.5" style={{ fontSize: 13, fontWeight: 750, color: "#11172c" }}>
                1 {invoice.currency} = {rate.toFixed(2)} USD
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 700, color: rateLive ? "#29b782" : "#8f93a8" }}>
              <span className="bs-dot-pulse" style={{ width: 7, height: 7, borderRadius: 9999, background: rateLive ? "#29b782" : "#8f93a8", color: rateLive ? "#29b782" : "#8f93a8" }} />
              {rateLive ? "Live" : "Cached"}
            </span>
          </div>

          {/* Transfer details accordion */}
          <div
            className="bs-reveal mt-3"
            style={{
              border: "1px solid rgba(75,62,177,0.1)",
              borderRadius: 16,
              background: "rgba(255,255,255,0.6)",
              animationDuration: "0.8s",
              animationDelay: "2.30s",
              animationTimingFunction: REVEAL_EASE,
            }}
          >
            <button
              onClick={() => setDetailsOpen((o) => !o)}
              className="w-full flex items-center justify-between text-left"
              style={{ padding: "15px 18px" }}
              aria-expanded={detailsOpen}
            >
              <span className="inline-flex items-center gap-2" style={{ fontSize: 11, fontWeight: 780, letterSpacing: "0.1em", color: "#343a52" }}>
                TRANSFER DETAILS
                <span
                  className="inline-flex items-center justify-center"
                  style={{ width: 20, height: 20, borderRadius: 9999, background: "#e9e5ff", color: "#6851f0", fontSize: 10, fontWeight: 800 }}
                >
                  5
                </span>
              </span>
              <span style={{ color: "#8f93a8" }}>
                <ChevronIcon open={detailsOpen} />
              </span>
            </button>
            <div className={`bs-acc-body ${detailsOpen ? "open" : ""}`}>
              <div className="bs-acc-inner">
                <div style={{ borderTop: "1px solid rgba(104,81,240,0.07)" }}>
                  {details.map(([k, v], i) => (
                    <div
                      key={k}
                      className="flex items-center justify-between gap-4"
                      style={{
                        padding: "14px 16px",
                        borderTop: i === 0 ? "none" : "1px solid rgba(104,81,240,0.07)",
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#8f93a8" }}>{k}</span>
                      <span
                        className="text-right break-all"
                        style={{ fontSize: 11, fontWeight: 670, color: "#343a52", maxWidth: "62%" }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            className="bs-reveal mt-4 grid gap-3 grid-cols-1 min-[521px]:grid-cols-2"
            style={{ animationDuration: "0.8s", animationDelay: "2.44s", animationTimingFunction: REVEAL_EASE }}
          >
            <WalletConnectButton />
            <button
              onClick={copyInvoiceNumber}
              className="bs-btn-ghost flex items-center justify-center gap-2 font-bold"
              style={{ borderRadius: 15, minHeight: 51, fontSize: 14, color: "#61667e", padding: "0 16px" }}
            >
              Copy invoice number
              <span style={{ color: "#8f93a8" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="12" height="12" rx="2.5" />
                  <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
                </svg>
              </span>
            </button>
          </div>

          {/* TXID */}
          {invoice.status !== "confirmed" && (
            <TxidForm invoiceId={invoice.id} onConfirmed={() => fetchStatus()} />
          )}
          {invoice.status === "confirmed" && invoice.txid && (
            <div
              className="mt-4"
              style={{ borderRadius: 16, background: "#29b78212", border: "1px solid #29b78233", padding: "16px 18px" }}
            >
              <div className="font-bold" style={{ fontSize: 13, color: "#1d8a61" }}>Payment confirmed</div>
              <div className="break-all font-mono mt-1" style={{ fontSize: 11, color: "#1d8a61" }}>{invoice.txid}</div>
            </div>
          )}

          {/* Footer */}
          <div
            className="bs-reveal-fade mt-6 text-center"
            style={{ animationDuration: "0.8s", animationDelay: "2.58s", animationTimingFunction: REVEAL_EASE }}
          >
            <p className="mb-3" style={{ fontSize: 9, color: "#8f93a8" }}>
              Invoice status does not replace a blockchain TXID.
            </p>
            <TrustRow />
          </div>
        </main>
      </div>

      <SupportChat />
      {toast && <Toast text={toast} />}
    </div>
  );
}
