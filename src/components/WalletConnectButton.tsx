"use client";

import { useState } from "react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useWalletReady } from "@/context/wallet";
import { WalletIcon } from "@/components/ui";

function truncate(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export default function WalletConnectButton({ onConnected }: { onConnected?: () => void }) {
  const ready = useWalletReady();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [showNotice, setShowNotice] = useState(false);

  function handleClick() {
    if (!ready) {
      setShowNotice(true);
      return;
    }
    // Launches the real Reown AppKit modal (QR on mobile, wallet list on desktop).
    open();
    onConnected?.();
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="bs-btn-primary w-full text-white font-bold flex items-center justify-center gap-2"
        style={{ borderRadius: 15, minHeight: 51, fontSize: 14, padding: "0 16px" }}
      >
        <WalletIcon size={19} />
        {isConnected && address ? truncate(address) : "Connect wallet"}
      </button>

      {/* Friendly notice when no WalletConnect project ID is configured */}
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
