// Send USDT — single-page real on-chain send panel.
// You connect YOUR OWN wallet and sign a REAL transfer of YOUR OWN USDT.
// Nothing custodial. No private keys ever touch this app.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useReadContract,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";
import {
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  parseUnits,
} from "viem";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import EvmConnectButton from "@/components/evm-connect";
import {
  NETWORKS,
  NETWORK_ORDER,
  EXPIRY_OPTIONS,
  HISTORY_KEY,
  type NetworkId,
  type NetworkDef,
  type SendRecord,
} from "@/config/networks";
import { isAppKitConfigured } from "@/config/wallets";
import { validateAmount, validateRecipient } from "@/lib/validation";
import {
  connectTron,
  disconnectTron,
  getTronAdapter,
  getTronBalances,
  getTronWeb,
  sendTronUsdt,
  waitTronConfirmation,
  type TronBalances,
} from "@/lib/tron";
import {
  getSolanaBalances,
  sendSolanaUsdt,
  type SolanaBalances,
} from "@/lib/solana";
import { ConfirmView, ReceiptView, NoticeModal } from "@/components/panel-bits";

// Minimal ERC-20 transfer ABI with NO return value declared — Ethereum's
// USDT transfer() returns no boolean, and declaring a bool return would
// break decoding. We send raw calldata and trust the receipt status.
const TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

type Step = "form" | "confirm" | "sending" | "done";

interface RateState {
  price: number;
  cached: boolean;
  loaded: boolean;
}

function shortAddr(a: string): string {
  return a.length > 13 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

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

function loadHistory(): SendRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SendRecord[]) : [];
  } catch {
    return [];
  }
}

export default function SendUsdtPage() {
  // ---- form state ----
  const [network, setNetwork] = useState<NetworkId>("bsc");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [expiryDays, setExpiryDays] = useState<number>(30);
  const [requestCreatedAt, setRequestCreatedAt] = useState<number>(() =>
    Date.now(),
  );
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<SendRecord[]>([]);
  const [rate, setRate] = useState<RateState>({
    price: 1,
    cached: true,
    loaded: false,
  });
  const [now, setNow] = useState(Date.now());
  const [showWcNotice, setShowWcNotice] = useState(false);
  const [evmFee, setEvmFee] = useState<string | null>(null);
  const [sent, setSent] = useState<SendRecord | null>(null);
  const [confirming, setConfirming] = useState(false);

  const net = NETWORKS[network];
  const expiresAt = requestCreatedAt + expiryDays * 86400_000;
  const expired = now >= expiresAt;

  // ---- live rate ----
  const fetchRate = useCallback(async () => {
    try {
      const res = await fetch("/api/rate");
      const data = (await res.json()) as { price: number; cached: boolean };
      if (typeof data.price === "number" && data.price > 0) {
        setRate({ price: data.price, cached: data.cached, loaded: true });
      }
    } catch {
      // keep last-known / parity fallback
    }
  }, []);
  useEffect(() => {
    fetchRate();
    const id = setInterval(fetchRate, 30_000);
    return () => clearInterval(id);
  }, [fetchRate]);

  // ---- clock + history ----
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const saveRecord = useCallback((rec: SendRecord) => {
    setHistory((prev) => {
      const next = [rec, ...prev].slice(0, 20);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable — history just won't persist
      }
      return next;
    });
  }, []);

  // ================= EVM (Ethereum / BSC) =================
  const { address: evmAddress, chainId: evmChainId, isConnected: evmConnected } =
    useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const evmPublicClient = usePublicClient({
    chainId: net.chainId as 1 | 56 | undefined,
  });

  const tokenAddress = net.tokenAddress as `0x${string}`;
  const { data: evmDecimals } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: net.chainId as 1 | 56 | undefined,
    query: { enabled: net.kind === "evm" && !!evmAddress },
  });
  const { data: evmBalance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: evmAddress ? [evmAddress] : undefined,
    chainId: net.chainId as 1 | 56 | undefined,
    query: { enabled: net.kind === "evm" && !!evmAddress },
  });
  const { data: evmNative } = useBalance({
    address: evmAddress,
    chainId: net.chainId as 1 | 56 | undefined,
    query: { enabled: net.kind === "evm" && !!evmAddress },
  });

  const evmDecimalsNum =
    typeof evmDecimals === "number" ? evmDecimals : net.decimalsFallback;
  const evmBalanceHuman =
    evmBalance !== undefined
      ? formatUnits(evmBalance, evmDecimalsNum)
      : null;

  // Live gas estimate on the confirm screen (best effort).
  useEffect(() => {
    if (step !== "confirm" || net.kind !== "evm" || !evmPublicClient) {
      setEvmFee(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rcpt = validateRecipient(recipient, network);
        if (!rcpt.valid || !evmAddress) return;
        const data = encodeFunctionData({
          abi: TRANSFER_ABI,
          functionName: "transfer",
          args: [rcpt.normalised as `0x${string}`, parseUnits(amount || "0", evmDecimalsNum)],
        });
        const gas = await evmPublicClient.estimateGas({
          account: evmAddress,
          to: tokenAddress,
          data,
        });
        const fees = await evmPublicClient.estimateFeesPerGas();
        const perGas = fees.maxFeePerGas ?? fees.gasPrice ?? 0n;
        const costWei = gas * perGas;
        const costNative = formatUnits(costWei, 18);
        const usd = (Number(costNative) * (net.id === "bsc" ? 600 : 3000)).toFixed(2);
        if (!cancelled) {
          setEvmFee(`≈ ${Number(costNative).toFixed(6)} ${net.gasToken} (≈ $${usd} at a rough ${net.gasToken} price — live gas only)`);
        }
      } catch {
        if (!cancelled) setEvmFee(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, network, amount, recipient, evmAddress]);

  // ================= Tron =================
  const [tronAddress, setTronAddress] = useState<string | null>(null);
  const [tronBalances, setTronBalances] = useState<TronBalances | null>(null);
  const tronWebRef = useRef(getTronWeb());

  useEffect(() => {
    const a = getTronAdapter();
    if (a.connected && a.address) setTronAddress(a.address);
  }, []);

  useEffect(() => {
    if (network !== "tron" || !tronAddress) {
      setTronBalances(null);
      return;
    }
    let cancelled = false;
    getTronBalances(tronWebRef.current, tronAddress)
      .then((b) => {
        if (!cancelled) setTronBalances(b);
      })
      .catch(() => {
        if (!cancelled) setTronBalances(null);
      });
    return () => {
      cancelled = true;
    };
  }, [network, tronAddress, step]);

  // ================= Solana =================
  const { connection } = useConnection();
  const {
    publicKey: solPublicKey,
    connected: solConnected,
    sendTransaction: solSendTransaction,
    disconnect: solDisconnect,
  } = useWallet();
  const { setVisible: setSolModalVisible } = useWalletModal();
  const [solBalances, setSolBalances] = useState<SolanaBalances | null>(null);

  useEffect(() => {
    if (network !== "solana" || !solPublicKey) {
      setSolBalances(null);
      return;
    }
    let cancelled = false;
    getSolanaBalances(connection, solPublicKey)
      .then((b) => {
        if (!cancelled) setSolBalances(b);
      })
      .catch(() => {
        if (!cancelled) setSolBalances(null);
      });
    return () => {
      cancelled = true;
    };
  }, [network, solPublicKey, connection, step]);

  // ---- derived wallet state ----
  const senderAddress =
    net.kind === "evm"
      ? (evmAddress ?? null)
      : net.kind === "tron"
        ? tronAddress
        : (solPublicKey?.toBase58() ?? null);
  const isConnected =
    net.kind === "evm"
      ? evmConnected
      : net.kind === "tron"
        ? !!tronAddress
        : solConnected;
  const balanceHuman =
    net.kind === "evm"
      ? evmBalanceHuman
      : net.kind === "tron"
        ? (tronBalances?.usdt ?? null)
        : (solBalances?.usdt ?? null);
  const nativeHuman =
    net.kind === "evm"
      ? (evmNative ? `${Number(formatUnits(evmNative.value, evmNative.decimals)).toFixed(4)} ${net.gasToken}` : null)
      : net.kind === "tron"
        ? (tronBalances ? `${Number(tronBalances.trx).toFixed(2)} TRX` : null)
        : (solBalances ? `${Number(solBalances.sol).toFixed(4)} SOL` : null);

  const connectWallet = useCallback(async () => {
    setError(null);
    try {
      if (net.kind === "evm") {
        // EVM connect goes through EvmConnectButton when configured;
        // this path only fires when no project ID is set.
        setShowWcNotice(true);
        return;
      } else if (net.kind === "tron") {
        const addr = await connectTron();
        setTronAddress(addr);
        showToast("TronLink connected");
      } else {
        setSolModalVisible(true);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Wallet connection failed. Make sure the wallet extension is installed and unlocked.",
      );
    }
  }, [net.kind, setSolModalVisible, showToast]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (net.kind === "tron") {
        await disconnectTron();
        setTronAddress(null);
      } else if (net.kind === "solana") {
        await solDisconnect();
      }
      // EVM disconnect happens from the AppKit modal (account view).
    } catch {
      // ignore
    }
  }, [net.kind, solDisconnect]);

  // ---- validation ----
  const amountCheck = validateAmount(amount);
  const recipientCheck = recipient ? validateRecipient(recipient, network) : null;
  const selfSend =
    !!senderAddress &&
    !!recipientCheck?.normalised &&
    (net.kind === "evm"
      ? recipientCheck.normalised.toLowerCase() === senderAddress.toLowerCase()
      : recipientCheck.normalised === senderAddress);
  const amountNum = Number(amount);
  const exceedsBalance =
    balanceHuman !== null && amountNum > 0 && amountNum > Number(balanceHuman);
  const usdValue =
    amountNum > 0 ? (amountNum * rate.price).toFixed(2) : "0.00";

  const formError =
    error ??
    (!amountCheck.valid && amount ? amountCheck.error : null) ??
    (recipientCheck && !recipientCheck.valid ? recipientCheck.error : null) ??
    (selfSend ? "The recipient is your own address. Sending to yourself is blocked." : null) ??
    (exceedsBalance
      ? `Amount exceeds your USDT balance (${balanceHuman} USDT on ${net.label}).`
      : null) ??
    (expired ? "This payment request has expired. Create a new request to send." : null);

  const canReview =
    amountCheck.valid &&
    !!recipientCheck?.valid &&
    !selfSend &&
    !exceedsBalance &&
    !expired;

  // ---- send ----
  const handleSend = useCallback(async () => {
    if (!canReview || !senderAddress) return;
    const rcpt = validateRecipient(recipient, network);
    if (!rcpt.valid || !rcpt.normalised) return;
    setError(null);
    setStep("sending");
    setConfirming(true);
    try {
      let txHash: string;
      let explorerUrl: string;
      let status: SendRecord["status"] = "sent";

      if (net.kind === "evm") {
        if (!evmAddress || !evmPublicClient) throw new Error("Wallet not connected.");
        if (evmChainId !== net.chainId) {
          await switchChainAsync({ chainId: net.chainId as 1 | 56 });
        }
        // Read decimals() live — BSC is 18, Ethereum is 6. Never hardcode.
        let decimals = net.decimalsFallback;
        try {
          const d = await evmPublicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "decimals",
          });
          if (typeof d === "number") decimals = d;
        } catch {
          // keep documented fallback
        }
        const data = encodeFunctionData({
          abi: TRANSFER_ABI,
          functionName: "transfer",
          args: [rcpt.normalised as `0x${string}`, parseUnits(amount, decimals)],
        });
        const hash = await sendTransactionAsync({
          to: tokenAddress,
          data,
          chainId: net.chainId as 1 | 56,
        });
        txHash = hash;
        explorerUrl = net.explorerTx(hash);
        try {
          const receipt = await evmPublicClient.waitForTransactionReceipt({
            hash: hash as `0x${string}`,
            timeout: 180_000,
          });
          status = receipt.status === "success" ? "confirmed" : "failed";
        } catch {
          status = "sent"; // broadcast OK, confirmation still pending
        }
      } else if (net.kind === "tron") {
        if (!tronAddress) throw new Error("TronLink wallet not connected.");
        const tronWeb = tronWebRef.current;
        const decimals = await (async () => {
          try {
            const contract = await tronWeb.contract().at(
              NETWORKS.tron.tokenAddress,
            );
            const d = await contract.decimals().call();
            const n = Number(d);
            return Number.isInteger(n) ? n : NETWORKS.tron.decimalsFallback;
          } catch {
            return NETWORKS.tron.decimalsFallback;
          }
        })();
        const res = await sendTronUsdt(
          tronWeb,
          tronAddress,
          rcpt.normalised,
          amount,
          decimals,
        );
        txHash = res.txid;
        explorerUrl = res.explorerUrl;
        const ok = await waitTronConfirmation(tronWeb, res.txid);
        status = ok ? "confirmed" : "sent";
      } else {
        if (!solPublicKey) throw new Error("Solana wallet not connected.");
        const decimals = await (async () => {
          try {
            const { getMint } = await import("@solana/spl-token");
            const { SOL_USDT_MINT } = await import("@/lib/solana");
            const mint = await getMint(connection, SOL_USDT_MINT);
            return mint.decimals;
          } catch {
            return NETWORKS.solana.decimalsFallback;
          }
        })();
        const res = await sendSolanaUsdt(
          connection,
          solPublicKey,
          solSendTransaction,
          rcpt.normalised,
          amount,
          decimals,
        );
        txHash = res.signature;
        explorerUrl = res.explorerUrl;
        status = "confirmed";
        if (res.ataCreated) {
          setNotice(
            "A token account was created for the recipient (one-time ~0.002 SOL rent, paid by you).",
          );
        }
      }

      const record: SendRecord = {
        id: `${Date.now()}-${txHash.slice(0, 8)}`,
        network,
        amount,
        recipient: rcpt.normalised,
        sender: senderAddress,
        txHash,
        explorerUrl,
        status,
        createdAt: Date.now(),
        expiresAt,
      };
      saveRecord(record);
      setSent(record);
      setStep("done");
      if (status === "failed") {
        setError("The transaction was mined but reported as failed. Check the explorer link — do not retry blindly.");
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Send failed. Check the explorer before retrying — a failed popup does not always mean the transaction failed.",
      );
      setStep("confirm");
    } finally {
      setConfirming(false);
    }
  }, [
    canReview,
    senderAddress,
    recipient,
    network,
    net,
    amount,
    expiresAt,
    evmAddress,
    evmChainId,
    evmPublicClient,
    switchChainAsync,
    sendTransactionAsync,
    tokenAddress,
    tronAddress,
    solPublicKey,
    connection,
    solSendTransaction,
    saveRecord,
  ]);

  const resetRequest = useCallback(() => {
    setRequestCreatedAt(Date.now());
    setAmount("");
    setRecipient("");
    setError(null);
    setNotice(null);
    setSent(null);
    setStep("form");
  }, []);

  const copy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied`);
      } catch {
        showToast("Copy failed — select the text manually");
      }
    },
    [showToast],
  );

  const wrongChain =
    net.kind === "evm" && evmConnected && evmChainId !== net.chainId;

  return (
    <main className="min-h-screen">
      {/* desktop-only floating decor */}
      <div aria-hidden className="pointer-events-none fixed inset-0 hidden min-[521px]:block">
        <div className="float-slow absolute left-[12%] top-[18%] flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(75,62,177,0.14)] bg-white/40 text-xl font-extrabold text-[#26a17b] backdrop-blur-md">T</div>
        <div className="float-slow2 absolute right-[13%] top-[30%] flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(75,62,177,0.14)] bg-white/40 text-lg font-extrabold text-[#6851f0] backdrop-blur-md">◆</div>
        <div className="float-slow absolute bottom-[22%] right-[20%] flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(75,62,177,0.14)] bg-white/40 text-lg font-extrabold text-[#26a17b] backdrop-blur-md">✓</div>
        <div className="absolute left-[22%] top-[64%] h-2 w-2 rounded-full bg-[#6a8dff]" />
        <div className="absolute right-[26%] top-[12%] h-2.5 w-2.5 rounded-full bg-[#8e7cff]" />
      </div>

      <div className="relative mx-auto w-full max-w-[480px] px-5 pb-12 pt-[30px]">
        {/* brandbar */}
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border border-[rgba(75,62,177,0.14)] bg-white/70 shadow-[0_4px_14px_rgba(55,45,120,0.08)] backdrop-blur-md">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#26a17b] text-[13px] font-extrabold text-white">T</span>
            </div>
            <span className="text-[19px] font-extrabold tracking-[-0.02em] text-[#11172c]">
              Send <span className="text-[#26a17b]">USDT</span>
            </span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-[rgba(75,62,177,0.12)] bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#343a52] backdrop-blur-md">
            <span className="h-[7px] w-[7px] rounded-full bg-[#29b782] dot-pulse" />
            Real on-chain send
          </span>
        </header>

        {/* glass card */}
        <section className="card-in rounded-[26px] border border-[rgba(75,62,177,0.12)] bg-white/90 shadow-[0_30px_90px_rgba(76,59,177,0.15),0_3px_14px_rgba(55,45,120,0.06)] backdrop-blur-[24px]">
          {step === "done" && sent ? (
            <ReceiptView
              record={sent}
              net={net}
              rate={rate}
              notice={notice}
              error={error}
              onCopy={copy}
              onNew={resetRequest}
            />
          ) : (
            <div className="p-5 sm:p-6">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#26a17b]">
                Real transfer · No custody
              </p>
              <h1 className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-[-0.045em] text-[#11172c]">
                Send <span className="text-[#6851f0]">USDT</span> to anyone
              </h1>
              <p className="mt-1 text-[13px] leading-snug text-[#8f93a8]">
                You send your own USDT from your own wallet. The transfer is a
                real on-chain transaction — the explorer link is the proof.
              </p>

              <div className="my-4 h-px bg-[rgba(75,62,177,0.1)]" />

              {/* live rate strip */}
              <div className="flex items-center justify-between rounded-2xl border border-[rgba(75,62,177,0.12)] bg-[#f7f6ffc7] px-[18px] py-3.5">
                <div>
                  <p className="text-[11px] text-[#8f93a8]">Current market rate</p>
                  <p className="text-[13px] font-bold text-[#11172c]">
                    1 USDT = {rate.loaded ? rate.price.toFixed(4) : "…"} USD
                  </p>
                </div>
                <span
                  className={`flex items-center gap-1.5 text-[11px] font-bold ${
                    rate.cached ? "text-[#8f93a8]" : "text-[#1d8a61]"
                  }`}
                >
                  <span
                    className={`h-[7px] w-[7px] rounded-full ${
                      rate.cached ? "bg-[#8f93a8]" : "bg-[#29b782] dot-pulse"
                    }`}
                  />
                  {rate.cached ? "Cached" : "Live"}
                </span>
              </div>

              {/* request expiry */}
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-[rgba(75,62,177,0.12)] bg-white/60 px-[18px] py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#343a52]">
                    Request expires in
                  </p>
                  <p className="text-[12px] text-[#8f93a8]">
                    {expired
                      ? "This request has expired — it can no longer be sent."
                      : fmtCountdown(expiresAt - now)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    expired
                      ? "bg-[#e93d3d0f] text-[#c92a2a]"
                      : "bg-[#e9e5ff] text-[#5037d8]"
                  }`}
                >
                  {expired ? "Expired" : `${expiryDays} days`}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-[#8f93a8]">
                The expiry is a countdown on this payment request only. Real
                USDT never expires — only the request does.
              </p>

              {step === "form" ? (
                <form
                  className="mt-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setError(null);
                    if (canReview) setStep("confirm");
                  }}
                >
                  {/* amount */}
                  <label className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#343a52]">
                    Amount
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="0.00"
                      className="w-full rounded-[16px] border border-[rgba(75,62,177,0.14)] bg-[#f8f7ffdb] px-4 py-3.5 pr-16 text-[30px] font-extrabold tracking-[-0.04em] text-[#11172c] placeholder:text-[#8f93a8] focus:border-[#6851f0] focus:outline-none focus:ring-4 focus:ring-[rgba(104,81,240,0.12)]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[#8f93a8]">
                      USDT
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-[#8f93a8]">
                    {amountNum > 0
                      ? `≈ $${usdValue} USD at the current rate`
                      : "Enter the amount of USDT to send."}
                    {balanceHuman !== null && (
                      <span className="text-[#343a52]">
                        {" "}· Balance: {Number(balanceHuman).toFixed(4)} USDT
                      </span>
                    )}
                  </p>

                  {/* network */}
                  <label className="mt-5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#343a52]">
                    Network
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2.5">
                    {NETWORK_ORDER.map((id) => {
                      const n = NETWORKS[id];
                      const active = id === network;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setNetwork(id);
                            setError(null);
                          }}
                          className={`rounded-[14px] border p-3 text-left transition ${
                            active
                              ? "border-[1.5px] border-[#6851f0] bg-[#6851f00d] ring-[0_0_0_3px_rgba(104,81,240,0.1)]"
                              : "border-[rgba(75,62,177,0.14)] bg-[#f8f7ffdb]"
                          }`}
                        >
                          <span
                            className={`block text-[13px] font-extrabold ${
                              active ? "text-[#5037d8]" : "text-[#343a52]"
                            }`}
                          >
                            {n.short} · {n.standard}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-tight text-[#8f93a8]">
                            {n.label}
                            {id === "bsc" ? " — Binance-Peg" : ""}
                          </span>
                          <span className="mt-1 block truncate font-mono text-[9.5px] text-[#8f93a8]">
                            {n.tokenAddress}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-[#8f93a8]">
                    {net.tokenLabel} · {net.tokenAddress}
                    {net.id === "bsc" &&
                      " — Binance-Peg USDT is issued by Binance, not by Tether. The address above is the token every wallet means by “USDT on BNB Chain”."}
                  </p>

                  {/* recipient */}
                  <label className="mt-5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#343a52]">
                    Recipient wallet address
                  </label>
                  <input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value.trim())}
                    placeholder={
                      net.kind === "evm"
                        ? "0x…"
                        : net.kind === "tron"
                          ? "T…"
                          : "Base58 address…"
                    }
                    spellCheck={false}
                    autoComplete="off"
                    className="mt-1.5 w-full rounded-[16px] border border-[rgba(75,62,177,0.14)] bg-white px-4 py-3.5 font-mono text-[12px] text-[#11172c] placeholder:text-[#8f93a8] focus:border-[#6851f0] focus:outline-none focus:ring-4 focus:ring-[rgba(104,81,240,0.12)]"
                  />
                  <p className="mt-1.5 text-[11px] leading-snug text-[#8f93a8]">
                    Must be a {net.label} address. An address from another
                    network will be rejected — USDT sent to the wrong chain is
                    lost. Never send to the token contract address.
                  </p>

                  {/* expiry */}
                  <label className="mt-5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#343a52]">
                    Request expiry
                  </label>
                  <div className="mt-1.5 grid grid-cols-4 gap-2">
                    {EXPIRY_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setExpiryDays(d)}
                        className={`rounded-[12px] border py-2.5 text-[13px] font-extrabold ${
                          expiryDays === d
                            ? "border-[#6851f0] bg-[#6851f00d] text-[#5037d8]"
                            : "border-[rgba(75,62,177,0.14)] bg-[#f8f7ffdb] text-[#343a52]"
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>

                  {formError && (
                    <div className="mt-4 rounded-[14px] border border-[#e93d3d33] bg-[#e93d3d0f] px-4 py-3 text-[13px] font-semibold text-[#c92a2a]">
                      {formError}
                    </div>
                  )}

                  {/* wallet row */}
                  <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[rgba(75,62,177,0.12)] bg-white/60 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#343a52]">
                        {isConnected ? "Connected wallet" : "Your wallet"}
                      </p>
                      <p className="truncate font-mono text-[12px] text-[#8f93a8]">
                        {isConnected && senderAddress
                          ? shortAddr(senderAddress)
                          : net.kind === "evm"
                            ? "MetaMask / Trust Wallet / any WalletConnect wallet"
                            : net.kind === "tron"
                              ? "TronLink"
                              : "Phantom / Solflare"}
                      </p>
                      {nativeHuman && (
                        <p className="text-[11px] text-[#8f93a8]">
                          Fee balance: {nativeHuman}
                        </p>
                      )}
                    </div>
                    {isConnected && net.kind === "evm" && isAppKitConfigured() ? (
                      <EvmConnectButton label="Account" />
                    ) : isConnected ? (
                      <button
                        type="button"
                        onClick={disconnectWallet}
                        className="shrink-0 rounded-[12px] border border-[rgba(75,62,177,0.14)] bg-[#f8f7ffdb] px-3.5 py-2.5 text-[13px] font-bold text-[#61667e]"
                      >
                        Disconnect
                      </button>
                    ) : net.kind === "evm" && isAppKitConfigured() ? (
                      <EvmConnectButton />
                    ) : (
                      <button
                        type="button"
                        onClick={connectWallet}
                        className="shrink-0 rounded-[12px] bg-gradient-to-br from-[#8c7aff] via-[#6851f0] to-[#5037d8] px-4 py-2.5 text-[13px] font-extrabold text-white shadow-[0_8px_18px_rgba(88,64,220,0.25)]"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-[#8f93a8]">
                    We never ask for seed phrases or private keys. You approve
                    every transfer inside your own wallet.
                  </p>
                  {wrongChain && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await switchChainAsync({ chainId: net.chainId as 1 | 56 });
                        } catch {
                          setError("Could not switch network in your wallet. Switch it manually and try again.");
                        }
                      }}
                      className="mt-3 w-full rounded-[14px] border border-[#e9932d55] bg-[#e9932d14] px-4 py-3 text-[13px] font-bold text-[#9a5b0b]"
                    >
                      Your wallet is on the wrong network — tap to switch to {net.label}
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!canReview || !isConnected || wrongChain}
                    className="mt-5 w-full rounded-[15px] bg-gradient-to-br from-[#26a17b] via-[#1f8a6a] to-[#157a5c] py-4 text-[16px] font-extrabold text-white shadow-[0_13px_28px_rgba(38,161,123,0.3)] transition hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {isConnected ? "Review send" : "Connect wallet to continue"}
                  </button>
                  {expired && (
                    <button
                      type="button"
                      onClick={resetRequest}
                      className="mt-3 w-full rounded-[15px] border border-[rgba(75,62,177,0.14)] bg-[#f8f7ffdb] py-3.5 text-[14px] font-bold text-[#61667e]"
                    >
                      Create a new request
                    </button>
                  )}
                </form>
              ) : (
                <ConfirmView
                  net={net}
                  amount={amount}
                  usdValue={usdValue}
                  recipient={recipientCheck?.normalised ?? recipient}
                  sender={senderAddress ?? ""}
                  expiresAt={expiresAt}
                  now={now}
                  feeLine={
                    net.kind === "evm"
                      ? (evmFee ?? `Typical fee ${net.typicalFee} in ${net.gasToken}.`)
                      : `Typical fee ${net.typicalFee} in ${net.gasToken}.`
                  }
                  feeNote={net.feeNote}
                  sending={step === "sending"}
                  error={error}
                  onBack={() => {
                    setError(null);
                    setStep("form");
                  }}
                  onConfirm={handleSend}
                />
              )}

              <p className="mt-5 text-center text-[9px] leading-relaxed text-[#8f93a8]">
                On-chain confirmation is the source of truth. This panel never
                holds your funds and never sees your keys. Test with a tiny
                amount first on each network.
              </p>
              <div className="mt-3 flex items-center justify-center gap-5 text-[11px] font-semibold text-[#8f93a8]">
                <span>Non-custodial</span>
                <span>·</span>
                <span>On-chain verified</span>
                <span>·</span>
                <span>No hidden fees</span>
              </div>
            </div>
          )}
        </section>

        {/* history */}
        {history.length > 0 && (
          <section className="mt-5 rounded-[26px] border border-[rgba(75,62,177,0.12)] bg-white/80 p-5 backdrop-blur-[24px]">
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#343a52]">
              Send history <span className="text-[#8f93a8]">(this device only)</span>
            </h2>
            <ul className="mt-3 space-y-3">
              {history.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 border-b border-[rgba(104,81,240,0.07)] pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#11172c]">
                      {r.amount} USDT · {NETWORKS[r.network].label}
                    </p>
                    <p className="truncate font-mono text-[11px] text-[#8f93a8]">
                      to {shortAddr(r.recipient)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        r.status === "confirmed"
                          ? "bg-[#29b78212] text-[#1d8a61]"
                          : r.status === "failed"
                            ? "bg-[#e93d3d0f] text-[#c92a2a]"
                            : "bg-[#e9932d14] text-[#9a5b0b]"
                      }`}
                    >
                      {r.status === "confirmed"
                        ? "Confirmed"
                        : r.status === "failed"
                          ? "Failed"
                          : "Sent"}
                    </span>
                    <a
                      href={r.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-[#6851f0]"
                    >
                      Explorer ↗
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* WalletConnect missing-ID notice */}
        {showWcNotice && (
          <NoticeModal
            title="WalletConnect is not configured"
            onClose={() => setShowWcNotice(false)}
          >
            <p>
              EVM wallet connections need a free WalletConnect project ID.
              Get one in about 5 minutes at{" "}
              <a className="font-bold text-[#6851f0]" href="https://cloud.reown.com" target="_blank" rel="noreferrer">
                cloud.reown.com
              </a>{" "}
              (Projects → Create Project → AppKit → Next.js), then set it as{" "}
              <code className="rounded bg-[#f8f7ff] px-1 py-0.5 font-mono text-[12px]">
                NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
              </code>{" "}
              in <code className="font-mono text-[12px]">.env.local</code> (and
              in Vercel → Settings → Environment Variables), then redeploy.
            </p>
            <p className="mt-2">
              Tron (TronLink) and Solana (Phantom / Solflare) do not need this
              ID — those connections work right now.
            </p>
          </NoticeModal>
        )}

        {toast && (
          <div
            role="status"
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1c183ae6] px-5 py-2.5 text-[13px] font-semibold text-white backdrop-blur-md"
          >
            ✓ {toast}
          </div>
        )}
      </div>
    </main>
  );
}
