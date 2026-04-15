// List of known tickers for client-side benchmark extraction
export const KNOWN_TICKERS = [
  // Positions & watchlist
  "NVDA", "AVGO", "TSM", "ASML", "GEV", "ETN", "PWR", "BWXT", "FCX", "OKLO", "NBIS",
  "SPUT", "OD7C", "WGLD", "WSLV", "WNUC", "IXJ", "RARE", "GDX", "W1TB",
  "CCJ", "NXE", "IBIT", "CRSP", "EWW", "OXY", "SPY", "VIX",
  // Common US ETFs & stocks AI might suggest
  "ROBO", "BOTZ", "ARKQ", "ISRG", "ROK", "ABB", "HON",
  "XYL", "AWK", "PHO", "WTS", "WTRG", "ECL",
  "LLY", "UNH", "ISRG", "ABBV", "PFE", "MRK", "JNJ",
  "PANW", "CRWD", "FTNT", "ZS",
  "LMT", "NOC", "RTX", "GD", "BA",
  "GOOG", "AMZN", "MSFT", "AAPL", "META",
  "INDA", "VNM", "EWW", "EWZ", "KWEB",
  "SLV", "GLD", "USO", "URA", "COPX", "REMX", "LIT",
  "XLF", "XLK", "XLE", "XLV", "XLI",
  "ARKK", "ARKG", "ARKW",
  "SMH", "SOXX", "QQQ",
];

/**
 * Extract the best benchmark ticker from an investmentMap string.
 * Priority: known EODHD ticker > any uppercase 2-5 char symbol.
 */
export function extractBenchmarkTicker(investmentMap: string): string | undefined {
  if (!investmentMap) return undefined;
  const words = investmentMap.match(/\b[A-Z][A-Z0-9]{1,4}\b/g);
  if (!words) return undefined;
  // Noise words to skip
  const SKIP = new Set(["ETF", "USD", "EUR", "ETC", "THE", "AND", "FOR", "NOT", "ALL", "BUY", "TOP", "IPO", "ESG", "GDP", "IMF", "FED", "SEC", "DAC", "IOT", "API"]);
  const filtered = words.filter((w) => !SKIP.has(w));
  // Prefer known tickers (available on EODHD)
  const known = filtered.find((w) => KNOWN_TICKERS.includes(w));
  if (known) return known;
  // Fall back to first plausible ticker (2+ chars, not a noise word)
  return filtered.find((w) => w.length >= 2) || undefined;
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
