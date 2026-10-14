"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NETWORKS } from "@/lib/networks";

export default function Home() {
  const router = useRouter();
  const [amount, setAmount] = useState("25");
  const [network, setNetwork] = useState("bsc");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: parsed, network, label: label.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create invoice");
      router.push(`/invoice/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f5fb] text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">
            Bit<span className="text-violet-600">Swap</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-full px-3 py-1.5 bg-white">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Secure invoice
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-20">
        {/* Hero */}
        <div className="text-center pt-10 pb-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-violet-600 uppercase mb-3">
            USDT invoice payments
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Get paid in crypto,
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              minus the headache.
            </span>
          </h1>
          <p className="text-slate-500 max-w-md mx-auto">
            Create a shareable invoice in seconds. Your payer connects a wallet,
            sends USDT, and you both watch it confirm — live.
          </p>
        </div>

        {/* Create invoice card */}
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(109,88,246,0.35)] border border-violet-100 p-6 sm:p-8"
        >
          <h2 className="text-lg font-bold mb-1">Create invoice</h2>
          <p className="text-sm text-slate-500 mb-6">
            You&apos;ll get a payment link you can send to anyone.
          </p>

          <label className="block text-sm font-semibold mb-2">Amount (USDT)</label>
          <div className="relative mb-5">
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-3xl font-extrabold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 pr-20"
              placeholder="25"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
              USDT
            </span>
          </div>

          <label className="block text-sm font-semibold mb-2">Network</label>
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setNetwork(n.id)}
                className={`rounded-2xl border px-4 py-3.5 text-left transition ${
                  network === n.id
                    ? "border-violet-600 bg-violet-50 ring-2 ring-violet-100"
                    : "border-slate-200 hover:border-violet-300 bg-white"
                }`}
              >
                <div className="font-bold text-sm">{n.short}</div>
                <div className="text-xs text-slate-500">{n.name}</div>
              </button>
            ))}
          </div>

          <label className="block text-sm font-semibold mb-2">
            Label <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={140}
            placeholder="e.g. Freelance design — October"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 mb-6"
          />

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-4 text-lg hover:opacity-95 active:scale-[0.99] transition disabled:opacity-60 shadow-[0_12px_30px_-10px_rgba(109,88,246,0.7)]"
          >
            {loading ? "Creating…" : "Create invoice"}
          </button>
        </form>

        {/* Feature bullets */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8 text-center">
          {[
            ["Private", "No account needed. Invoices are just links."],
            ["Verified request", "On-chain receipt checks for BSC."],
            ["Fast", "Live status updates as it confirms."],
          ].map(([t, d]) => (
            <div key={t} className="bg-white rounded-2xl border border-slate-100 px-4 py-5">
              <div className="font-bold text-sm mb-1">✓ {t}</div>
              <div className="text-xs text-slate-500">{d}</div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-10">
          Invoice status does not replace a blockchain TXID.
        </p>
      </main>
    </div>
  );
}
