// Confirm + receipt + notice views for the Send USDT panel.

import type { ReactNode } from "react";
import { NETWORKS, type NetworkDef, type SendRecord } from "@/config/networks";

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "Expired";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[rgba(104,81,240,0.07)] py-2.5 last:border-0">
      <span className="shrink-0 text-[11px] text-[#8f93a8]">{label}</span>
      <span className="break-all text-right text-[11px] font-semibold text-[#343a52]">
        {value}
      </span>
    </div>
  );
}

export function ConfirmView(props: {
  net: NetworkDef;
  amount: string;
  usdValue: string;
  recipient: string;
  sender: string;
  expiresAt: number;
  now: number;
  feeLine: string;
  feeNote: string;
  sending: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const {
    net,
    amount,
    usdValue,
    recipient,
    sender,
    expiresAt,
    now,
    feeLine,
    feeNote,
    sending,
    error,
    onBack,
    onConfirm,
  } = props;
  return (
    <div className="mt-5">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#26a17b]">
        Check everything before you send
      </p>
      <h2 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.04em] text-[#11172c]">
        Confirm your send
      </h2>
      <p className="mt-1 text-[13px] text-[#8f93a8]">
        This is a real on-chain transfer. Once confirmed in your wallet it
        cannot be undone.
      </p>

      {/* amount hero */}
      <div className="relative mt-4 overflow-hidden rounded-[19px] bg-gradient-to-br from-[#26a17b] via-[#1f8a6a] to-[#157a5c] p-[22px] text-white shadow-[0_18px_44px_rgba(38,161,123,0.32)]">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-[208px] w-[208px] rounded-full border-[34px] border-white/10" />
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-white/85">
            You are sending
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-bold">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[11px] font-extrabold text-[#26a17b]">T</span>
            USDT
          </span>
        </div>
        <p className="mt-3 text-[clamp(38px,11vw,52px)] font-extrabold leading-none tracking-[-0.06em]">
          {amount}
        </p>
        <p className="mt-1.5 text-[12px] font-semibold text-white/75">
          ≈ ${usdValue} USD
        </p>
      </div>

      {/* details */}
      <div className="mt-4 rounded-2xl border border-[rgba(75,62,177,0.12)] bg-white/60 px-[18px] py-2">
        <DetailRow label="Network" value={`${net.label} · ${net.standard}`} />
        <DetailRow label="Token" value={`${net.tokenLabel} — ${net.tokenAddress}`} />
        <DetailRow label="From (you)" value={sender} />
        <DetailRow label="To (recipient)" value={recipient} />
        <DetailRow label="Amount" value={`${amount} USDT (≈ $${usdValue})`} />
        <DetailRow label="Network fee" value={feeLine} />
        <DetailRow label="Request expires" value={fmtCountdown(expiresAt - now)} />
      </div>

      <p className="mt-3 text-[11px] leading-snug text-[#8f93a8]">{feeNote}</p>
      <p className="mt-2 text-[11px] leading-snug text-[#8f93a8]">
        Compare the first and last characters of the recipient address above
        with the address you were given. USDT sent to the wrong address or
        the wrong network cannot be recovered.
      </p>

      {error && (
        <div className="mt-4 rounded-[14px] border border-[#e93d3d33] bg-[#e93d3d0f] px-4 py-3 text-[13px] font-semibold text-[#c92a2a]">
          {error}
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={sending}
        className="mt-5 w-full rounded-[15px] bg-gradient-to-br from-[#26a17b] via-[#1f8a6a] to-[#157a5c] py-4 text-[16px] font-extrabold text-white shadow-[0_13px_28px_rgba(38,161,123,0.3)] transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {sending ? "Waiting for your wallet…" : "Confirm & send in wallet"}
      </button>
      <button
        onClick={onBack}
        disabled={sending}
        className="mt-3 w-full rounded-[15px] border border-[rgba(75,62,177,0.14)] bg-[#f8f7ffdb] py-3.5 text-[14px] font-bold text-[#61667e] disabled:opacity-60"
      >
        Back to edit
      </button>
    </div>
  );
}

export function ReceiptView(props: {
  record: SendRecord;
  net: NetworkDef;
  rate: { price: number; cached: boolean };
  notice: string | null;
  error: string | null;
  onCopy: (text: string, label: string) => void;
  onNew: () => void;
}) {
  const { record, net, rate, notice, error, onCopy, onNew } = props;
  const usd = (Number(record.amount) * rate.price).toFixed(2);
  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#26a17b]">
            {record.status === "confirmed"
              ? "Confirmed on-chain"
              : record.status === "failed"
                ? "Transaction failed"
                : "Sent — confirming"}
          </p>
          <h2 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.04em] text-[#11172c]">
            {record.status === "failed"
              ? "Send did not go through"
              : `${record.amount} USDT sent`}
          </h2>
        </div>
        <span
          className={`mt-1 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
            record.status === "confirmed"
              ? "border-[#29b78233] bg-[#29b78212] text-[#1d8a61]"
              : record.status === "failed"
                ? "border-[#e93d3d33] bg-[#e93d3d0f] text-[#c92a2a]"
                : "border-[#e9932d55] bg-[#e9932d14] text-[#9a5b0b]"
          }`}
        >
          <span
            className={`h-[7px] w-[7px] rounded-full ${
              record.status === "confirmed"
                ? "bg-[#29b782]"
                : record.status === "failed"
                  ? "bg-[#e93d3d]"
                  : "bg-[#e9932d] dot-pulse"
            }`}
          />
          {record.status === "confirmed"
            ? "Confirmed"
            : record.status === "failed"
              ? "Failed"
              : "Confirming"}
        </span>
      </div>

      {/* amount hero */}
      <div className="relative mt-4 overflow-hidden rounded-[19px] bg-gradient-to-br from-[#8e7cff] via-[#6a51ef] to-[#5238d7] p-[22px] text-white shadow-[0_18px_44px_rgba(88,64,220,0.32)]">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-[208px] w-[208px] rounded-full border-[34px] border-white/10" />
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-white/85">
            {record.status === "failed" ? "Attempted amount" : "You sent"}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-bold">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#26a17b] text-[11px] font-extrabold text-white">T</span>
            USDT
          </span>
        </div>
        <p className="mt-3 text-[clamp(38px,11vw,52px)] font-extrabold leading-none tracking-[-0.06em]">
          {record.amount}
        </p>
        <p className="mt-1.5 text-[12px] font-semibold text-white/75">
          ≈ ${usd} USD · {net.label} ({net.standard})
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgba(75,62,177,0.12)] bg-white/60 px-[18px] py-2">
        <DetailRow label="From (you)" value={record.sender} />
        <DetailRow label="To (recipient)" value={record.recipient} />
        <DetailRow label="Network" value={`${net.label} · ${net.standard}`} />
        <DetailRow label="Token" value={`${net.tokenLabel} — ${net.tokenAddress}`} />
      </div>

      {/* tx hash box */}
      <div className="mt-4 rounded-2xl border border-[rgba(75,62,177,0.12)] bg-[#f8f7ffdb] p-[18px]">
        <p className="text-[13px] font-extrabold text-[#11172c]">
          Transaction hash
        </p>
        <p className="mt-1 break-all font-mono text-[12px] text-[#343a52]">
          {record.txHash}
        </p>
        <div className="mt-3 flex gap-2">
          <a
            href={record.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-[12px] bg-gradient-to-br from-[#8c7aff] via-[#6851f0] to-[#5037d8] px-4 py-2.5 text-[13px] font-extrabold text-white"
          >
            View on explorer ↗
          </a>
          <button
            onClick={() => onCopy(record.txHash, "Transaction hash")}
            className="rounded-[12px] border border-[rgba(75,62,177,0.14)] bg-white px-4 py-2.5 text-[13px] font-bold text-[#61667e]"
          >
            Copy hash
          </button>
        </div>
        {record.status === "sent" && (
          <p className="mt-3 text-[11px] leading-snug text-[#8f93a8]">
            Broadcast to the network. If the explorer still shows it as
            pending, wait a minute and refresh — confirmation is the source of
            truth, not this page.
          </p>
        )}
      </div>

      {notice && (
        <div className="mt-4 rounded-[14px] border border-[#e9932d55] bg-[#e9932d14] px-4 py-3 text-[13px] font-semibold text-[#9a5b0b]">
          {notice}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-[14px] border border-[#e93d3d33] bg-[#e93d3d0f] px-4 py-3 text-[13px] font-semibold text-[#c92a2a]">
          {error}
        </div>
      )}

      <button
        onClick={onNew}
        className="mt-5 w-full rounded-[15px] bg-gradient-to-br from-[#26a17b] via-[#1f8a6a] to-[#157a5c] py-4 text-[16px] font-extrabold text-white shadow-[0_13px_28px_rgba(38,161,123,0.3)]"
      >
        Send another
      </button>
      <p className="mt-4 text-center text-[9px] leading-relaxed text-[#8f93a8]">
        This receipt is saved in this browser&apos;s send history only. The
        explorer link is the permanent proof of the transfer.
      </p>
    </div>
  );
}

export function NoticeModal(props: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#11172c66] p-4 sm:items-center">
      <div className="w-full max-w-[420px] rounded-[20px] bg-white p-5 shadow-2xl">
        <h3 className="text-[17px] font-extrabold tracking-[-0.02em] text-[#11172c]">
          {props.title}
        </h3>
        <div className="mt-2 text-[13px] leading-relaxed text-[#343a52]">
          {props.children}
        </div>
        <button
          onClick={props.onClose}
          className="mt-4 w-full rounded-[14px] bg-gradient-to-br from-[#8c7aff] via-[#6851f0] to-[#5037d8] py-3 text-[14px] font-extrabold text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export function shortAddr(a: string): string {
  return a.length > 13 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export { NETWORKS };
