// List of known tickers for client-side benchmark extraction
export const KNOWN_TICKERS = [
  "NVDA", "AVGO", "TSM", "ASML", "GEV", "ETN", "PWR", "BWXT", "FCX", "OKLO", "NBIS",
  "SPUT", "OD7C", "WGLD", "WSLV", "WNUC", "IXJ", "RARE", "GDX", "W1TB",
  "CCJ", "NXE", "IBIT", "CRSP", "EWW", "OXY", "SPY", "VIX",
];

/**
 * Extract the first known EODHD-available ticker from an investmentMap string.
 * Falls back to any uppercase 2-4 letter word if no known ticker matches.
 */
export function extractBenchmarkTicker(investmentMap: string): string | undefined {
  if (!investmentMap) return undefined;
  const words = investmentMap.match(/\b[A-Z][A-Z0-9]{1,4}\b/g);
  if (!words) return undefined;
  // Prefer known tickers (available on EODHD)
  const known = words.find((w) => KNOWN_TICKERS.includes(w));
  return known || undefined;
}

export const TICKER_MAP: Record<string, { symbol: string; exchange: string }> = {
  // Physical ETCs (EU-listed)
  "SPUT": { symbol: "SPUT", exchange: "LSE" },
  "OD7C": { symbol: "OD7C", exchange: "XETRA" },
  "WGLD": { symbol: "WGLD", exchange: "XETRA" },
  "WSLV": { symbol: "WSLV", exchange: "XETRA" },
  // Miner/Sector ETFs
  "WNUC": { symbol: "WNUC", exchange: "XETRA" },
  "IXJ": { symbol: "IXJ", exchange: "US" },
  "RARE": { symbol: "RARE", exchange: "XETRA" },
  "GDX": { symbol: "GDX", exchange: "US" },
  "W1TB": { symbol: "W1TB", exchange: "XETRA" },
  // Individual stocks
  "CCJ": { symbol: "CCJ", exchange: "US" },
  "NXE": { symbol: "NXE", exchange: "US" },
  // Crypto
  "IBIT": { symbol: "IBIT", exchange: "US" },
  // Benchmark proxies
  "CRSP": { symbol: "CRSP", exchange: "US" },
  "EWW": { symbol: "EWW", exchange: "US" },
  "OXY": { symbol: "OXY", exchange: "US" },
  // Crash Watchlist
  "NVDA": { symbol: "NVDA", exchange: "US" },
  "AVGO": { symbol: "AVGO", exchange: "US" },
  "TSM": { symbol: "TSM", exchange: "US" },
  "ASML": { symbol: "ASML", exchange: "US" },
  "GEV": { symbol: "GEV", exchange: "US" },
  "ETN": { symbol: "ETN", exchange: "US" },
  "PWR": { symbol: "PWR", exchange: "US" },
  "BWXT": { symbol: "BWXT", exchange: "US" },
  "FCX": { symbol: "FCX", exchange: "US" },
  "OKLO": { symbol: "OKLO", exchange: "US" },
  "NBIS": { symbol: "NBIS", exchange: "US" },
  // Market Indicators
  "VIX": { symbol: "VIX", exchange: "INDX" },
  "SPY": { symbol: "SPY", exchange: "US" },
};
