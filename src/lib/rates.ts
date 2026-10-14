// USDT/USD rate with a short server-side cache. Falls back to 1.00 on failure.

let cached: { value: number; at: number } | null = null;
const CACHE_TTL_MS = 60_000;

export async function getUsdtUsdRate(): Promise<{ rate: number; live: boolean }> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return { rate: cached.value, live: true };
  }
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd",
      { next: { revalidate: 60 }, headers: { accept: "application/json" } }
    );
    if (!res.ok) throw new Error(`coingecko ${res.status}`);
    const data = await res.json();
    const rate = Number(data?.tether?.usd);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("bad rate payload");
    cached = { value: rate, at: now };
    return { rate, live: true };
  } catch {
    // Fall back to last known value, else parity.
    return { rate: cached?.value ?? 1.0, live: cached !== null };
  }
}
