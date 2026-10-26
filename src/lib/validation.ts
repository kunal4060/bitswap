// Per-network recipient-address validation.
// Rules verified 2026-10-26 (see research contracts.md).
// Never accept an address for the wrong network — USDT sent to the wrong
// chain is lost.

import { isAddress, getAddress } from "viem";
import { TronWeb } from "tronweb";
import { PublicKey } from "@solana/web3.js";
import { NETWORKS, type NetworkId } from "@/config/networks";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  /** Checksummed / canonical form for display. */
  normalised?: string;
}

/** EVM (Ethereum / BSC): 0x + 40 hex chars, EIP-55 checksum. */
function validateEvm(address: string, network: NetworkId): ValidationResult {
  const net = NETWORKS[network];
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return {
      valid: false,
      error: "Enter a valid wallet address: 0x followed by 40 hex characters.",
    };
  }
  if (!isAddress(address)) {
    return { valid: false, error: "That address failed the checksum check." };
  }
  let checksummed: string;
  try {
    checksummed = getAddress(address);
  } catch {
    return { valid: false, error: "That address failed the checksum check." };
  }
  if (checksummed.toLowerCase() === net.tokenAddress.toLowerCase()) {
    return {
      valid: false,
      error:
        "That is the USDT token contract address itself. Sending USDT there is unrecoverable — never send to a contract address.",
    };
  }
  return { valid: true, normalised: checksummed };
}

/** Tron (TRC-20): Base58Check, T-prefix, exactly 34 chars. */
function validateTron(address: string): ValidationResult {
  if (address.startsWith("0x")) {
    return {
      valid: false,
      error:
        "That looks like an Ethereum address (0x…). Tron addresses start with T — switch network or paste a Tron address.",
    };
  }
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
    return {
      valid: false,
      error:
        "Enter a valid Tron address: starts with T, exactly 34 characters.",
    };
  }
  if (!TronWeb.isAddress(address)) {
    return { valid: false, error: "That Tron address failed validation." };
  }
  if (address === NETWORKS.tron.tokenAddress) {
    return {
      valid: false,
      error:
        "That is the USDT token contract address itself. Sending USDT there is unrecoverable — never send to a contract address.",
    };
  }
  return { valid: true, normalised: address };
}

/** Solana (SPL): Base58, 32–44 chars, decoding to exactly 32 bytes. */
function validateSolana(address: string): ValidationResult {
  if (address.startsWith("0x") || address.startsWith("T")) {
    return {
      valid: false,
      error:
        "That address belongs to another network. Solana addresses are Base58 public keys (32–44 characters).",
    };
  }
  let key: PublicKey;
  try {
    key = new PublicKey(address);
  } catch {
    return {
      valid: false,
      error: "Enter a valid Solana address (a Base58 public key).",
    };
  }
  if (key.toBase58() !== address) {
    return {
      valid: false,
      error: "Enter a valid Solana address (a Base58 public key).",
    };
  }
  if (address === NETWORKS.solana.tokenAddress) {
    return {
      valid: false,
      error:
        "That is the USDT mint address itself. Never send to the mint address.",
    };
  }
  return { valid: true, normalised: key.toBase58() };
}

export function validateRecipient(
  address: string,
  network: NetworkId,
): ValidationResult {
  const trimmed = address.trim();
  if (!trimmed) return { valid: false, error: "Enter the recipient's address." };
  const kind = NETWORKS[network].kind;
  if (kind === "evm") return validateEvm(trimmed, network);
  if (kind === "tron") return validateTron(trimmed);
  return validateSolana(trimmed);
}

/** Amount: numeric, > 0, at most 6 decimal places. */
export function validateAmount(
  amount: string,
  maxDecimals = 6,
): ValidationResult {
  const trimmed = amount.trim();
  if (!trimmed) return { valid: false, error: "Enter an amount greater than 0." };
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { valid: false, error: "Enter a valid amount (numbers only)." };
  }
  const [, frac] = trimmed.split(".");
  if (frac && frac.length > maxDecimals) {
    return {
      valid: false,
      error: `Amount can have at most ${maxDecimals} decimal places.`,
    };
  }
  if (Number(trimmed) <= 0) {
    return { valid: false, error: "Enter an amount greater than 0." };
  }
  return { valid: true };
}
