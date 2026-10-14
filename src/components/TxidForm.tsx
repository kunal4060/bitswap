"use client";

import { useState } from "react";

export default function TxidForm({
  invoiceId,
  onConfirmed,
}: {
  invoiceId: string;
  onConfirmed: (status: string) => void;
}) {
  const [txid, setTxid] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const value = txid.trim();
    if (!value) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/txid`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ txid: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data?.error ?? "Verification failed" });
      } else if (data.status === "confirmed") {
        setMessage({ ok: true, text: "Payment confirmed on-chain. Thank you!" });
        onConfirmed(data.status);
      } else {
        setMessage({
          ok: true,
          text: data.note ?? "Hash accepted — status set to confirming.",
        });
        onConfirmed(data.status);
      }
    } catch {
      setMessage({ ok: false, text: "Network error — please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="mt-4"
      style={{
        borderRadius: 16,
        border: "1px solid rgba(75,62,177,0.1)",
        background: "#f8f7ffdb",
        padding: "18px",
      }}
    >
      <h3 className="font-extrabold" style={{ fontSize: 13, color: "#11172c" }}>
        I&apos;ve sent the payment — submit TXID
      </h3>
      <p className="mb-3 mt-1" style={{ fontSize: 11, color: "#8f93a8" }}>
        Paste your transaction hash and we&apos;ll verify it on the blockchain.
      </p>
      <form onSubmit={submit} className="flex flex-col min-[521px]:flex-row gap-2">
        <input
          value={txid}
          onChange={(e) => setTxid(e.target.value)}
          placeholder="0x…"
          spellCheck={false}
          className="bs-input flex-1 font-mono"
          style={{
            borderRadius: 12,
            border: "1px solid rgba(75,62,177,0.14)",
            background: "#fff",
            padding: "11px 14px",
            fontSize: 12,
            color: "#11172c",
          }}
        />
        <button
          type="submit"
          disabled={loading || !txid.trim()}
          className="bs-btn-primary text-white font-bold shrink-0 disabled:opacity-50"
          style={{ borderRadius: 12, fontSize: 13, padding: "11px 22px" }}
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>
      {message && (
        <div
          className="mt-3"
          style={{
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 12,
            fontWeight: 600,
            background: message.ok ? "#29b78212" : "#e93d3d0f",
            border: message.ok ? "1px solid #29b78233" : "1px solid #e93d3d33",
            color: message.ok ? "#1d8a61" : "#c92a2a",
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
