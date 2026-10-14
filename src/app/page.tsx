"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NETWORKS } from "@/lib/networks";
import BootIntro from "@/components/BootIntro";
import Brandbar from "@/components/Brandbar";
import SupportChat from "@/components/SupportChat";
import { TrustRow, FloatingDecor } from "@/components/ui";

const REVEAL_EASE = "cubic-bezier(.2,.75,.2,1)";

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
          <p style={{ fontSize: 11, fontWeight: 780, letterSpacing: "0.12em", color: "#6851f0" }}>
            USDT INVOICES
          </p>
          <h1
            className="mt-1.5"
            style={{ fontSize: 26, fontWeight: 810, letterSpacing: "-0.045em", color: "#11172c" }}
          >
            Create <span style={{ color: "#6851f0" }}>invoice</span>
          </h1>
          <p className="mt-1.5" style={{ fontSize: 12, color: "#8f93a8" }}>
            You&apos;ll get a payment link you can send to anyone.
          </p>

          <div className="my-5" style={{ borderTop: "1px solid rgba(75,62,177,0.1)" }} />

          <form onSubmit={onSubmit}>
            {/* Amount */}
            <div
              className="bs-reveal"
              style={{ animationDuration: "0.8s", animationDelay: "2.02s", animationTimingFunction: REVEAL_EASE }}
            >
              <label className="block mb-2" style={{ fontSize: 11, fontWeight: 780, letterSpacing: "0.1em", color: "#343a52" }}>
                AMOUNT
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="25"
                  className="bs-input w-full"
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(75,62,177,0.14)",
                    background: "#f8f7ffdb",
                    padding: "16px 76px 16px 18px",
                    fontSize: 30,
                    fontWeight: 830,
                    letterSpacing: "-0.04em",
                    color: "#11172c",
                  }}
                />
                <span
                  className="absolute right-5 top-1/2 -translate-y-1/2"
                  style={{ fontSize: 12, fontWeight: 800, color: "#8f93a8" }}
                >
                  USDT
                </span>
              </div>
            </div>

            {/* Network */}
            <div
              className="bs-reveal mt-5"
              style={{ animationDuration: "0.8s", animationDelay: "2.16s", animationTimingFunction: REVEAL_EASE }}
            >
              <label className="block mb-2" style={{ fontSize: 11, fontWeight: 780, letterSpacing: "0.1em", color: "#343a52" }}>
                NETWORK
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {NETWORKS.map((n) => {
                  const active = network === n.id;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setNetwork(n.id)}
                      className="text-left"
                      style={{
                        borderRadius: 14,
                        border: active ? "1.5px solid #6851f0" : "1px solid rgba(75,62,177,0.12)",
                        background: active ? "#6851f00d" : "#f8f7ffdb",
                        padding: "12px 10px",
                        boxShadow: active ? "0 0 0 3px rgba(104,81,240,0.1)" : "none",
                        transition: "all .2s cubic-bezier(.2,.75,.2,1)",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: active ? "#5037d8" : "#343a52" }}>
                        {n.short}
                      </div>
                      <div className="mt-0.5" style={{ fontSize: 9.5, color: "#8f93a8", fontWeight: 500, lineHeight: 1.3 }}>
                        {n.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Label */}
            <div
              className="bs-reveal mt-5"
              style={{ animationDuration: "0.8s", animationDelay: "2.30s", animationTimingFunction: REVEAL_EASE }}
            >
              <label className="block mb-2" style={{ fontSize: 11, fontWeight: 780, letterSpacing: "0.1em", color: "#343a52" }}>
                LABEL <span style={{ color: "#8f93a8", fontWeight: 500, letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={140}
                placeholder="e.g. Freelance design — October"
                className="bs-input w-full"
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(75,62,177,0.14)",
                  background: "#f8f7ffdb",
                  padding: "13px 16px",
                  fontSize: 13,
                  color: "#11172c",
                }}
              />
            </div>

            {error && (
              <div
                className="mt-4"
                style={{
                  borderRadius: 14,
                  background: "#e93d3d0f",
                  border: "1px solid #e93d3d33",
                  color: "#c92a2a",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "12px 16px",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <div
              className="bs-reveal mt-5"
              style={{ animationDuration: "0.8s", animationDelay: "2.44s", animationTimingFunction: REVEAL_EASE }}
            >
              <button
                type="submit"
                disabled={loading}
                className="bs-btn-primary w-full text-white font-extrabold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ borderRadius: 15, minHeight: 54, fontSize: 16 }}
              >
                {loading ? (
                  <span
                    className="inline-block w-5 h-5 rounded-full animate-spin"
                    style={{ border: "2.5px solid rgba(255,255,255,0.35)", borderTopColor: "#fff" }}
                  />
                ) : null}
                {loading ? "Creating…" : "Create invoice"}
              </button>
            </div>
          </form>

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
    </div>
  );
}
