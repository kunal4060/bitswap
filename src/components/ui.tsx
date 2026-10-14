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

/** Floating glass decor — frosted bubbles with crypto glyphs + accent dots (hidden on small screens). */
export function FloatingDecor() {
  const bubbles: {
    size: number; top: string; left?: string; right?: string;
    delay: string; dur: string; glyph?: "tether" | "eth" | "check"; diamond?: boolean;
  }[] = [
    { size: 76, top: "20%", left: "27%", delay: "0s", dur: "8s", glyph: "tether" },
    { size: 52, top: "55%", left: "29%", delay: "1.6s", dur: "7s", glyph: "check" },
    { size: 64, top: "56%", right: "28%", delay: "0.9s", dur: "9s", glyph: "eth", diamond: true },
    { size: 44, top: "82%", left: "30%", delay: "2.2s", dur: "7.5s", glyph: "check" },
  ];
  const dots = [
    { size: 8, top: "18%", right: "24%", color: "#8e7cff", delay: "0.4s", dur: "6s" },
    { size: 10, top: "46%", left: "22%", color: "#8e7cff", delay: "1.8s", dur: "7s" },
    { size: 8, top: "72%", right: "20%", color: "#6a8dff", delay: "1.1s", dur: "6.5s" },
    { size: 6, top: "84%", left: "38%", color: "#8e7cff", delay: "2.6s", dur: "5.5s" },
    { size: 7, top: "30%", right: "33%", color: "#6a8dff", delay: "0.2s", dur: "7.5s" },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 z-0 hidden min-[521px]:block" aria-hidden>
      {bubbles.map((b, i) => (
        <span
          key={`b${i}`}
          className="bs-float absolute flex items-center justify-center"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            right: b.right,
            borderRadius: b.diamond ? 18 : 9999,
            transform: b.diamond ? "rotate(12deg)" : undefined,
            background: "rgba(255,255,255,0.42)",
            border: "1px solid rgba(104,81,240,0.16)",
            boxShadow: "0 14px 34px rgba(104,81,240,0.14), inset 0 2px 10px rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            animationDelay: b.delay,
            animationDuration: b.dur,
            color: "#6851f0",
          }}
        >
          {b.glyph === "tether" && (
            <svg width={b.size * 0.42} height={b.size * 0.42} viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" fill="#26a17b" opacity="0.9" />
              <path d="M10 11h12v2.6h-4.7V22h-2.6v-8.4H10V11z" fill="#fff" />
            </svg>
          )}
          {b.glyph === "eth" && (
            <svg width={b.size * 0.4} height={b.size * 0.4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
              <path d="M12 2l7 10-7 4-7-4 7-10z" />
              <path d="M5 12l7 4 7-4-7 10-7-10z" opacity="0.55" />
            </svg>
          )}
          {b.glyph === "check" && (
            <svg width={b.size * 0.36} height={b.size * 0.36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          )}
        </span>
      ))}
      {dots.map((d, i) => (
        <span
          key={`d${i}`}
          className="bs-float absolute rounded-full"
          style={{
            width: d.size,
            height: d.size,
            top: d.top,
            left: d.left,
            right: d.right,
            background: d.color,
            opacity: 0.75,
            boxShadow: `0 4px 12px ${d.color}66`,
            animationDelay: d.delay,
            animationDuration: d.dur,
          }}
        />
      ))}
    </div>
  );
}
