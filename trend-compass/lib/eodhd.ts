import { TICKER_MAP } from "./ticker-map";
import type { PriceData } from "./types";

const API_KEY = process.env.EODHD_API_KEY;
const BASE = "https://eodhd.com/api";

export async function fetchPrice(ticker: string): Promise<PriceData | null> {
  if (!API_KEY) return null;
  const mapping = TICKER_MAP[ticker];
  if (!mapping) return null;

  const url = `${BASE}/real-time/${mapping.symbol}.${mapping.exchange}?api_token=${API_KEY}&fmt=json`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.close !== "number" || isNaN(data.close)) return null;
    return {
      close: data.close,
      change_p: data.change_p,
      volume: data.volume,
      previousClose: data.previousClose,
    };
  } catch {
    return null;
  }
}

export async function fetchAllPrices(): Promise<Record<string, PriceData>> {
  const tickers = Object.keys(TICKER_MAP);
  const results: Record<string, PriceData> = {};

  // Batch in groups of 5 to avoid rate limits
  for (let i = 0; i < tickers.length; i += 5) {
    const batch = tickers.slice(i, i + 5);
    const promises = batch.map(async (ticker) => {
      const price = await fetchPrice(ticker);
      if (price) results[ticker] = price;
    });
    await Promise.all(promises);
  }

  return results;
}
