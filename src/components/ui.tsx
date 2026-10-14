"use client";

/* Shared inline SVG line icons (1.8px stroke) + small UI atoms. */

export function WalletIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="6" width="19" height="13" rx="3.5" />
      <path d="M2.5 10.5h19" />
      <path d="M16.5 15h1.5" />
    </svg>
  );
}

export function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </svg>
  );
}

export function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function ChevronIcon({ size = 18, open = false }: { size?: number; open?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .34s cubic-bezier(.2,.75,.2,1)" }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ShieldIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-3.6 8-10V5.2L12 2 4 5.2V12c0 6.4 8 10 8 10Z" />
    </svg>
  );
}

export function BoltIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" />
    </svg>
  );
}

export function ChatIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" strokeWidth="2.4" />
    </svg>
  );
}

/** Status pill: purple=processing, orange=confirming, green=confirmed. */
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    processing: { label: "Processing", color: "#6851f0", bg: "#6851f012" },
    confirming: { label: "Confirming", color: "#e9932d", bg: "#e9932d14" },
    confirmed: { label: "Confirmed", color: "#29b782", bg: "#29b78214" },
  };
  const s = map[status] ?? map.processing;
  return (
    <span
      className="inline-flex items-center gap-1.5 shrink-0"
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: s.color,
        background: s.bg,
        borderRadius: 9999,
        padding: "7px 12px",
        border: `1px solid ${s.color}22`,
      }}
    >
      <span className="bs-dot-pulse" style={{ width: 7, height: 7, borderRadius: 9999, background: s.color, color: s.color }} />
      {s.label}
    </span>
  );
}

/** Dark toast pill, bottom-center. */
export function Toast({ text }: { text: string }) {
  return (
    <div
      className="bs-toast fixed bottom-8 left-1/2 z-[90] flex items-center gap-2"
      style={{
        background: "#1c183ae6",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        borderRadius: 9999,
        padding: "11px 20px",
        boxShadow: "0 12px 32px rgba(20,16,60,0.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      role="status"
    >
      <CheckIcon size={15} />
      {text}
    </div>
  );
}

/** Trust row: Private · Verified request · Fast (purple icons). */
export function TrustRow() {
  const items = [
    { icon: <ShieldIcon />, label: "Private" },
    { icon: <CheckIcon />, label: "Verified request" },
    { icon: <BoltIcon />, label: "Fast" },
  ];
  return (
    <div className="flex items-center justify-center gap-5" style={{ color: "#8f93a8", fontSize: 11, fontWeight: 600 }}>
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5" style={{ color: "#6851f0" }}>
          {it.icon}
          <span style={{ color: "#8f93a8" }}>{it.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Floating glass decor orbs (hidden on small screens). */
export function FloatingDecor() {
  const orbs = [
    { size: 84, top: "16%", left: "6%", delay: "0s", dur: "8s" },
    { size: 56, top: "58%", left: "10%", delay: "1.4s", dur: "7s" },
    { size: 68, top: "38%", right: "7%", delay: "0.8s", dur: "9s" },
    { size: 40, top: "74%", right: "12%", delay: "2s", dur: "7.5s" },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 z-0 hidden min-[521px]:block" aria-hidden>
      {orbs.map((o, i) => (
        <span
          key={i}
          className="bs-float absolute rounded-full"
          style={{
            width: o.size,
            height: o.size,
            top: o.top,
            left: o.left,
            right: o.right,
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(104,81,240,0.14)",
            boxShadow: "0 14px 34px rgba(104,81,240,0.12), inset 0 2px 8px rgba(255,255,255,0.8)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            animationDelay: o.delay,
            animationDuration: o.dur,
          }}
        />
      ))}
    </div>
  );
}
