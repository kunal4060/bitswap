"use client";

import Link from "next/link";

/** Brandbar: 42px glass logo mark + wordmark, "Secure invoice" pill on the right. */
export default function Brandbar() {
  return (
    <div
      className="bs-reveal flex items-center justify-between mb-5"
      style={{ animationDuration: "0.72s", animationDelay: "1.82s" }}
    >
      <Link href="/" className="flex items-center gap-2.5" aria-label="BitSwap home">
        <span
          className="flex items-center justify-center"
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(75,62,177,0.14)",
            boxShadow: "0 8px 22px rgba(104,81,240,0.16)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6851f0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1a2 2 0 0 1-1 1.73l-6 3.54A2 2 0 0 1 9 15.99V16" />
            <path d="M7 16h10" />
            <path d="M7 20h10" opacity="0.5" />
          </svg>
        </span>
        <span style={{ fontSize: 19, fontWeight: 810, letterSpacing: "-0.02em", color: "#11172c" }}>
          Bit<span style={{ color: "#6851f0" }}>Swap</span>
        </span>
      </Link>
      <span
        className="inline-flex items-center gap-1.5"
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#343a52",
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(75,62,177,0.12)",
          borderRadius: 9999,
          padding: "7px 12px",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: 9999, background: "#29b782" }} />
        Secure invoice
      </span>
    </div>
  );
}
