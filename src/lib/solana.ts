// Solana (SPL) send helpers — @solana/web3.js v1 + @solana/spl-token.
// The user signs in their own wallet (Phantom / Solflare / …); no private
// key ever touches this app.

import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { NETWORKS } from "@/config/networks";

export const SOL_USDT_MINT = new PublicKey(NETWORKS.solana.tokenAddress);

export interface SolanaBalances {
  usdt: string;
  usdtRaw: bigint;
  sol: string;
  decimals: number;
}

export async function readSolanaDecimals(
  connection: Connection,
): Promise<number> {
  try {
    const mint = await getMint(connection, SOL_USDT_MINT);
    return mint.decimals;
  } catch {
    return NETWORKS.solana.decimalsFallback;
  }
}

export async function getSolanaBalances(
  connection: Connection,
  owner: PublicKey,
): Promise<SolanaBalances> {
  const decimals = await readSolanaDecimals(connection);
  const ata = await getAssociatedTokenAddress(SOL_USDT_MINT, owner);
  let usdtRaw = 0n;
  try {
    const acc = await getAccount(connection, ata);
    usdtRaw = acc.amount;
  } catch {
    usdtRaw = 0n; // no token account yet = 0 USDT
  }
  const lamports = await connection.getBalance(owner);
  return {
    usdt: (Number(usdtRaw) / 10 ** decimals).toString(),
    usdtRaw,
    sol: (lamports / LAMPORTS_PER_SOL).toString(),
    decimals,
  };
}

export interface SolanaSendResult {
  signature: string;
  explorerUrl: string;
  ataCreated: boolean;
}

/**
 * Send SPL USDT. Creates the recipient's Associated Token Account first
 * (one-time ~0.002 SOL rent, paid by the sender) only if it does not exist.
 */
export async function sendSolanaUsdt(
  connection: Connection,
  sender: PublicKey,
  sendTransaction: (
    tx: Transaction,
    connection: Connection,
  ) => Promise<string>,
  recipient: string,
  amount: string,
  decimals: number,
): Promise<SolanaSendResult> {
  const recipientKey = new PublicKey(recipient);
  const fromAta = await getAssociatedTokenAddress(SOL_USDT_MINT, sender);
  const toAta = await getAssociatedTokenAddress(SOL_USDT_MINT, recipientKey);

  const [whole, frac = ""] = amount.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const baseUnits = BigInt(whole + padded);

  const ixns = [];
  let ataCreated = false;
  try {
    await getAccount(connection, toAta);
  } catch {
    ixns.push(
      createAssociatedTokenAccountInstruction(
        sender,
        toAta,
        recipientKey,
        SOL_USDT_MINT,
      ),
    );
    ataCreated = true;
  }
  ixns.push(
    createTransferInstruction(fromAta, toAta, sender, baseUnits),
  );

  const tx = new Transaction().add(...ixns);
  tx.feePayer = sender;
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  const signature = await sendTransaction(tx, connection);
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return {
    signature,
    explorerUrl: NETWORKS.solana.explorerTx(signature),
    ataCreated,
  };
}
