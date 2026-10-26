// GET /api/rate — USDT/USD price from CoinGecko, server-side.
// 60 s in-memory cache; on failure returns the last-known value, then
// parity (1.00) — always flagged with `cached: true` so the UI never
// pretends a stale price is live.

export const dynamic = "force-dynamic";

interface CacheEntry {
  price: number;
  fetchedAt: number;
}

let cache: CacheEntry | null = null;
const CACHE_MS = 60_000;

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_MS) {
    return Response.json({ price: cache.price, cached: false, source: "coingecko" });
  }
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd",
      { next: { revalidate: 0 } },
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = (await res.json()) as { tether?: { usd?: number } };
    const price = data?.tether?.usd;
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      throw new Error("Bad price payload");
    }
    cache = { price, fetchedAt: now };
    return Response.json({ price, cached: false, source: "coingecko" });
  } catch {
    if (cache) {
      return Response.json({ price: cache.price, cached: true, source: "coingecko" });
    }
    return Response.json({ price: 1, cached: true, source: "parity-fallback" });
  }
}
