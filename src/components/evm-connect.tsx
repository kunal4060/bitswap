// EVM connect button — isolated because useAppKit() throws unless
// createAppKit has run, which only happens when a WalletConnect project ID
// is configured. This component is only rendered in that case.

"use client";

import { useAppKit } from "@reown/appkit/react";

export default function EvmConnectButton({ label = "Connect" }: { label?: string }) {
  const { open } = useAppKit();
  return (
    <button
      type="button"
      onClick={() => open()}
      className="shrink-0 rounded-[12px] bg-gradient-to-br from-[#8c7aff] via-[#6851f0] to-[#5037d8] px-4 py-2.5 text-[13px] font-extrabold text-white shadow-[0_8px_18px_rgba(88,64,220,0.25)]"
    >
      {label}
    </button>
  );
}
