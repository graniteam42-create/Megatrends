import { getEnv } from "./env";
import { logger } from "./logger";
import { TICKER_MAP } from "./ticker-map";
import type { PriceData } from "./types";

const BASE = "https://eodhd.com/api";

function apiKey(): string | null {
  return getEnv("EODHD_API_KEY") || null;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function resolveSymbol(ticker: string): { symbol: string; exchange: string } {
  const mapping = TICKER_MAP[ticker];
  // Default to US exchange for unknown tickers (most AI-suggested tickers are US-listed).
  return {
    symbol: mapping?.symbol || ticker,
    exchange: mapping?.exchange || "US",
  };
}

async function fetchEod(
  ticker: string,
  from: Date,
  to: Date,
  revalidate: number
): Promise<Array<{ close: number; high?: number; volume?: number }> | null> {
  const key = apiKey();
  if (!key) return null;
  const { symbol, exchange } = resolveSymbol(ticker);
  const url = `${BASE}/eod/${symbol}.${exchange}?from=${formatDate(from)}&to=${formatDate(to)}&period=d&api_token=${key}&fmt=json`;
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) {
      logger.debug("eodhd non-OK", { ticker, status: res.status });
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 1) return null;
    return data as Array<{ close: number; high?: number; volume?: number }>;
  } catch (e) {
    logger.warn("eodhd fetch failed", {
      ticker,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

export async function fetchPrice(ticker: string): Promise<PriceData | null> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const data = await fetchEod(ticker, from, to, 3600);
  if (!data) return null;

  const latest = data[data.length - 1];
  const prev = data.length >= 2 ? data[data.length - 2] : null;
  if (typeof latest.close !== "number" || !Number.isFinite(latest.close)) return null;
  const prevClose = prev && typeof prev.close === "number" ? prev.close : undefined;
  const change_p = prevClose ? ((latest.close - prevClose) / prevClose) * 100 : 0;
  return {
    close: latest.close,
    change_p,
    volume: latest.volume,
    previousClose: prevClose,
  };
}

async function mapConcurrently<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency = 8
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

export async function fetchAllPrices(): Promise<Record<string, PriceData>> {
  const tickers = Object.keys(TICKER_MAP);
  const results: Record<string, PriceData> = {};
  await mapConcurrently(tickers, async (ticker) => {
    const price = await fetchPrice(ticker);
    if (price) results[ticker] = price;
  });
  return results;
}

export async function fetch52WeekHigh(ticker: string): Promise<number | null> {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  const data = await fetchEod(ticker, from, to, 86400);
  if (!data) return null;
  let maxHigh = 0;
  for (const day of data) {
    if (typeof day.high === "number" && day.high > maxHigh) maxHigh = day.high;
  }
  return maxHigh > 0 ? maxHigh : null;
}

export async function fetchAll52WeekHighs(
  tickers: string[]
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  await mapConcurrently(tickers, async (ticker) => {
    const high = await fetch52WeekHigh(ticker);
    if (high !== null) results[ticker] = high;
  });
  return results;
}

export async function fetchHistoricalPerformance(
  ticker: string,
  days: number
): Promise<number | null> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - Math.ceil(days * 1.6));
  const data = await fetchEod(ticker, from, to, 3600);
  if (!data || data.length < 2) return null;
  const latest = data[data.length - 1].close;
  const pastIdx = Math.max(0, data.length - days);
  const past = data[pastIdx].close;
  if (typeof latest !== "number" || typeof past !== "number" || past === 0) return null;
  return ((latest - past) / past) * 100;
}
