"use client";

import { useState } from "react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useWalletReady } from "@/context/wallet";

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
        className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-4 px-4 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 shadow-[0_12px_30px_-10px_rgba(109,88,246,0.7)]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="6" width="20" height="14" rx="3" />
          <path d="M2 10h20M16 15h2" />
        </svg>
        {isConnected && address ? truncate(address) : "Connect wallet"}
      </button>

      {/* Friendly notice when no WalletConnect project ID is configured */}
      {showNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" onClick={() => setShowNotice(false)}>
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl mb-4">
              W
            </div>
            <h3 className="font-bold text-lg mb-2">WalletConnect is not configured</h3>
            <p className="text-sm text-slate-600 mb-4">
              To enable wallet connections, get a free project ID from{" "}
              <span className="font-mono">cloud.reown.com</span> and set it as{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
              </code>{" "}
              in your <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">.env.local</code>,
              then restart the app.
            </p>
            <p className="text-xs text-slate-500 mb-5">
              We never ask for seed phrases or private keys — only connect through the official
              WalletConnect modal.
            </p>
            <button
              onClick={() => setShowNotice(false)}
              className="w-full rounded-xl bg-slate-900 text-white font-semibold py-3 text-sm hover:bg-slate-800"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
