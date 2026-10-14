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
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-bold text-sm mb-1">I&apos;ve sent the payment — submit TXID</h3>
      <p className="text-xs text-slate-500 mb-3">
        Paste your transaction hash and we&apos;ll verify it on the blockchain.
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={txid}
          onChange={(e) => setTxid(e.target.value)}
          placeholder="0x…"
          spellCheck={false}
          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-violet-500"
        />
        <button
          type="submit"
          disabled={loading || !txid.trim()}
          className="rounded-xl bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>
      {message && (
        <div
          className={`mt-3 rounded-xl px-4 py-3 text-sm border ${
            message.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
