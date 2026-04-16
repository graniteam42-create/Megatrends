import { TICKER_MAP } from "./ticker-map";
import type { PriceData } from "./types";

const API_KEY = process.env.EODHD_API_KEY;
const BASE = "https://eodhd.com/api";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function fetchPrice(ticker: string): Promise<PriceData | null> {
  if (!API_KEY) return null;
  const mapping = TICKER_MAP[ticker];
  // Default to US exchange for unknown tickers (most AI-suggested tickers are US-listed)
  const symbol = mapping?.symbol || ticker;
  const exchange = mapping?.exchange || "US";

  // Use EOD historical endpoint (last 5 calendar days to get 2 trading days)
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const url = `${BASE}/eod/${symbol}.${exchange}?from=${formatDate(from)}&to=${formatDate(to)}&period=d&api_token=${API_KEY}&fmt=json`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 1) return null;
    const latest = data[data.length - 1];
    const prev = data.length >= 2 ? data[data.length - 2] : null;
    if (typeof latest.close !== "number" || isNaN(latest.close)) return null;
    const prevClose = prev && typeof prev.close === "number" ? prev.close : undefined;
    const change_p = prevClose ? ((latest.close - prevClose) / prevClose) * 100 : 0;
    return {
      close: latest.close,
      change_p,
      volume: latest.volume,
      previousClose: prevClose,
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

export async function fetch52WeekHigh(ticker: string): Promise<number | null> {
  if (!API_KEY) return null;
  const mapping = TICKER_MAP[ticker];
  const symbol = mapping?.symbol || ticker;
  const exchange = mapping?.exchange || "US";

  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);

  const url = `${BASE}/eod/${symbol}.${exchange}?from=${formatDate(from)}&to=${formatDate(to)}&period=d&api_token=${API_KEY}&fmt=json`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 1) return null;
    let maxHigh = 0;
    for (const day of data) {
      if (typeof day.high === "number" && day.high > maxHigh) maxHigh = day.high;
    }
    return maxHigh > 0 ? maxHigh : null;
  } catch {
    return null;
  }
}

export async function fetchAll52WeekHighs(tickers: string[]): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  for (let i = 0; i < tickers.length; i += 5) {
    const batch = tickers.slice(i, i + 5);
    await Promise.all(
      batch.map(async (ticker) => {
        const high = await fetch52WeekHigh(ticker);
        if (high !== null) results[ticker] = high;
      })
    );
  }
  return results;
}

export async function fetchHistoricalPerformance(
  ticker: string,
  days: number
): Promise<number | null> {
  if (!API_KEY) return null;
  const mapping = TICKER_MAP[ticker];
  const symbol = mapping?.symbol || ticker;
  const exchange = mapping?.exchange || "US";

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - Math.ceil(days * 1.6));

  const url = `${BASE}/eod/${symbol}.${exchange}?from=${formatDate(from)}&to=${formatDate(to)}&period=d&api_token=${API_KEY}&fmt=json`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) return null;
    const latest = data[data.length - 1].close;
    const pastIdx = Math.max(0, data.length - days);
    const past = data[pastIdx].close;
    if (typeof latest !== "number" || typeof past !== "number" || past === 0) return null;
    return ((latest - past) / past) * 100;
  } catch {
    return null;
  }
}
