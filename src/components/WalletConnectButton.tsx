"use client";

import { useState } from "react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useWalletReady } from "@/context/wallet";
import { WalletIcon } from "@/components/ui";

function truncate(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

const BTN_STYLE = {
  borderRadius: 15,
  minHeight: 51,
  fontSize: 14,
  padding: "0 16px",
} as const;

/** Real AppKit button — only rendered when AppKit is initialized (hooks are safe here). */
function AppKitConnectButton({ onConnected }: { onConnected?: () => void }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  return (
    <button
      onClick={() => {
        open();
        onConnected?.();
      }}
      className="bs-btn-primary w-full text-white font-bold flex items-center justify-center gap-2"
      style={BTN_STYLE}
    >
      <WalletIcon size={19} />
      {isConnected && address ? truncate(address) : "Connect wallet"}
    </button>
  );
}

/** Fallback when no WalletConnect project ID is configured — no AppKit hooks touched. */
function NoticeButton() {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowNotice(true)}
        className="bs-btn-primary w-full text-white font-bold flex items-center justify-center gap-2"
        style={BTN_STYLE}
      >
        <WalletIcon size={19} />
        Connect wallet
      </button>

      {showNotice && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center p-4"
          style={{ background: "rgba(28,24,58,0.45)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          onClick={() => setShowNotice(false)}
        >
          <div
            className="w-full max-w-sm"
            style={{
              background: "rgba(255,255,255,0.96)",
              borderRadius: 22,
              padding: 26,
              boxShadow: "0 30px 90px rgba(76,59,177,0.25)",
              border: "1px solid rgba(75,62,177,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-center text-white font-extrabold text-xl mb-4"
              style={{ width: 48, height: 48, borderRadius: 15, background: "linear-gradient(135deg,#8c7aff,#5037d8)" }}
            >
              W
            </div>
            <h3 className="font-extrabold text-lg mb-2" style={{ color: "#11172c" }}>
              WalletConnect is not configured
            </h3>
            <p className="text-sm mb-4" style={{ color: "#343a52" }}>
              To enable wallet connections, get a free project ID from{" "}
              <span className="font-mono">cloud.reown.com</span> and set it as{" "}
              <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#f1efff" }}>
                NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
              </code>{" "}
              in your <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#f1efff" }}>.env.local</code>,
              then restart the app.
            </p>
            <p className="text-xs mb-5" style={{ color: "#8f93a8" }}>
              We never ask for seed phrases or private keys — only connect through the official
              WalletConnect modal.
            </p>
            <button
              onClick={() => setShowNotice(false)}
              className="bs-btn-primary w-full text-white font-bold text-sm"
              style={{ borderRadius: 14, padding: "13px 0" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function WalletConnectButton({ onConnected }: { onConnected?: () => void }) {
  const ready = useWalletReady();
  // Never call AppKit hooks unless AppKit was initialized — otherwise the page crashes.
  if (!ready) return <NoticeButton />;
  return <AppKitConnectButton onConnected={onConnected} />;
}
