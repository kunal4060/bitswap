// Tron (TRC-20) send helpers — TronWeb v6 + TronLink adapter.
// The user signs in their own TronLink wallet; no private key ever
// touches this app.

import { TronWeb } from "tronweb";
import { TronLinkAdapter } from "@tronweb3/tronwallet-adapter-tronlink";
import { NETWORKS } from "@/config/networks";

export const TRON_USDT = NETWORKS.tron.tokenAddress;

export function getTronWeb(): TronWeb {
  return new TronWeb({ fullHost: NETWORKS.tron.rpc });
}

let adapter: TronLinkAdapter | null = null;

export function getTronAdapter(): TronLinkAdapter {
  if (!adapter) adapter = new TronLinkAdapter();
  return adapter;
}

export async function connectTron(): Promise<string> {
  const a = getTronAdapter();
  if (a.connected && a.address) return a.address;
  await a.connect();
  if (!a.address) throw new Error("TronLink did not return an address.");
  return a.address;
}

export async function disconnectTron(): Promise<void> {
  const a = getTronAdapter();
  if (a.connected) await a.disconnect();
}

export interface TronBalances {
  usdt: string; // human-readable USDT
  usdtRaw: bigint;
  trx: string; // human-readable TRX
  decimals: number;
}

/** Read on-chain USDT decimals (verified 6, but never trust — read it). */
export async function readTronDecimals(tronWeb: TronWeb): Promise<number> {
  try {
    const contract = await tronWeb.contract().at(TRON_USDT);
    const d = await contract.decimals().call();
    const n = Number(d);
    if (Number.isInteger(n) && n > 0 && n <= 36) return n;
  } catch {
    // fall through to documented fallback
  }
  return NETWORKS.tron.decimalsFallback;
}

export async function getTronBalances(
  tronWeb: TronWeb,
  address: string,
): Promise<TronBalances> {
  const decimals = await readTronDecimals(tronWeb);
  const contract = await tronWeb.contract().at(TRON_USDT);
  const raw = await contract.balanceOf(address).call();
  const usdtRaw = BigInt(raw.toString());
  const trxSun = await tronWeb.trx.getBalance(address);
  const usdt = (Number(usdtRaw) / 10 ** decimals).toString();
  const trx = (Number(trxSun) / 1_000_000).toString();
  return { usdt, usdtRaw, trx, decimals };
}

export interface TronSendResult {
  txid: string;
  explorerUrl: string;
}

/**
 * Send TRC-20 USDT. Builds the triggerSmartContract call, asks the
 * connected TronLink wallet to sign, then broadcasts.
 */
export async function sendTronUsdt(
  tronWeb: TronWeb,
  from: string,
  recipient: string,
  amount: string,
  decimals: number,
): Promise<TronSendResult> {
  // Exact base-unit conversion (string math — no float rounding):
  const [whole, frac = ""] = amount.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const exact = BigInt(whole + padded).toString();

  const built = await tronWeb.transactionBuilder.triggerSmartContract(
    TRON_USDT,
    "transfer(address,uint256)",
    { feeLimit: 100_000_000 }, // 100 TRX max fee cap (in SUN)
    [
      { type: "address", value: recipient },
      { type: "uint256", value: exact },
    ],
    from,
  );
  if (!built.result || !built.transaction) {
    throw new Error("Tron could not build the transfer. Check the recipient and try again.");
  }
  const a = getTronAdapter();
  const signed = await a.signTransaction(built.transaction);
  const res = await tronWeb.trx.sendRawTransaction(signed);
  const txid =
    (res as { txid?: string; transaction?: { txID?: string } }).txid ??
    (res as { transaction?: { txID?: string } }).transaction?.txID;
  if (!txid) {
    throw new Error("Tron did not return a transaction ID. Check Tronscan before retrying.");
  }
  return { txid, explorerUrl: NETWORKS.tron.explorerTx(txid) };
}

/** Poll Tronscan/TronGrid until the tx is confirmed (or timeout). */
export async function waitTronConfirmation(
  tronWeb: TronWeb,
  txid: string,
  timeoutMs = 120_000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const info = await tronWeb.trx.getTransactionInfo(txid);
      if (info && (info as { receipt?: { result?: string } }).receipt) {
        return (
          (info as { receipt: { result: string } }).receipt.result === "SUCCESS"
        );
      }
    } catch {
      // not mined yet
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}
