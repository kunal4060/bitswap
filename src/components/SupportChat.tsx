"use client";

import { useState, useRef, useEffect } from "react";
import { ChatIcon } from "@/components/ui";

interface Msg {
  from: "user" | "bot";
  text: string;
}

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: "Hi! I'm BitSwap support. Ask me about invoice status, wallets, networks, or fees." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text }]);
    setSending(true);
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { from: "bot", text: data.reply ?? "Sorry, something went wrong. Try again." },
      ]);
    } catch {
      setMessages((m) => [...m, { from: "bot", text: "Network error — please try again." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating launcher: 58px teal circle, bottom-right 24px offsets */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open support chat"
        className="fixed z-[80] flex items-center justify-center transition active:scale-95 hover:-translate-y-0.5"
        style={{
          bottom: 24,
          right: 24,
          width: 58,
          height: 58,
          borderRadius: 9999,
          background: "#087f88",
          boxShadow: "0 8px 24px rgba(4,65,75,0.28), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <ChatIcon size={26} />
        )}
        <span
          className="absolute"
          style={{
            top: 3,
            right: 3,
            width: 12,
            height: 12,
            borderRadius: 9999,
            background: "#29b782",
            border: "2.5px solid #087f88",
          }}
        />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed z-[80] flex flex-col overflow-hidden"
          style={{
            bottom: 96,
            right: 24,
            width: 330,
            maxWidth: "calc(100vw - 48px)",
            height: 440,
            maxHeight: "60vh",
            background: "rgba(255,255,255,0.97)",
            borderRadius: 22,
            border: "1px solid rgba(75,62,177,0.12)",
            boxShadow: "0 30px 90px rgba(76,59,177,0.22)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div
            className="flex items-center gap-3"
            style={{ padding: "16px 18px", borderBottom: "1px solid rgba(75,62,177,0.08)" }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: 42, height: 42, borderRadius: 9999, background: "linear-gradient(135deg,#0aa0ac,#087f88)" }}
            >
              <ChatIcon size={22} />
            </div>
            <div className="flex-1">
              <div className="font-extrabold" style={{ fontSize: 14, color: "#11172c" }}>Support</div>
              <div className="font-semibold" style={{ fontSize: 11, color: "#29b782" }}>Online</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="leading-none"
              style={{ color: "#8f93a8", fontSize: 22, padding: 4 }}
            >
              ×
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto space-y-2.5" style={{ padding: "14px 16px", background: "#f8f7ff80" }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="leading-snug"
                  style={{
                    maxWidth: "80%",
                    borderRadius: 16,
                    borderBottomRightRadius: m.from === "user" ? 6 : 16,
                    borderBottomLeftRadius: m.from === "user" ? 16 : 6,
                    padding: "10px 14px",
                    fontSize: 13,
                    background: m.from === "user" ? "linear-gradient(135deg,#8c7aff,#5037d8)" : "#fff",
                    color: m.from === "user" ? "#fff" : "#343a52",
                    border: m.from === "user" ? "none" : "1px solid rgba(75,62,177,0.1)",
                    boxShadow: m.from === "user" ? "0 6px 16px rgba(104,81,240,0.25)" : "none",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div
                  className="text-sm"
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(75,62,177,0.1)",
                    borderRadius: 16,
                    borderBottomLeftRadius: 6,
                    padding: "10px 14px",
                    color: "#8f93a8",
                  }}
                >
                  Typing…
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2" style={{ borderTop: "1px solid rgba(75,62,177,0.08)", padding: 12 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Write a message"
              className="bs-input flex-1"
              style={{
                borderRadius: 12,
                border: "1px solid rgba(75,62,177,0.14)",
                padding: "10px 14px",
                fontSize: 13,
                color: "#11172c",
              }}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="bs-btn-primary shrink-0 flex items-center justify-center text-white disabled:opacity-40"
              style={{ width: 42, height: 42, borderRadius: 12 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
