export const TICKER_MAP: Record<string, { symbol: string; exchange: string }> = {
  // Physical ETCs (EU-listed)
  "SPUT": { symbol: "SPUT", exchange: "LSE" },
  "OD7C": { symbol: "OD7C", exchange: "XETRA" },
  "WGLD": { symbol: "WGLD", exchange: "XETRA" },
  "WSLV": { symbol: "WSLV", exchange: "XETRA" },
  // Miner/Sector ETFs
  "U3O8": { symbol: "U3O8", exchange: "LSE" },
  "WNUC": { symbol: "WNUC", exchange: "XETRA" },
  "IXJ": { symbol: "IXJ", exchange: "US" },
  "RARE": { symbol: "RARE", exchange: "XETRA" },
  "GDX": { symbol: "GDX", exchange: "US" },
  "W1TB": { symbol: "W1TB", exchange: "XETRA" },
  // Individual stocks
  "CCJ": { symbol: "CCJ", exchange: "US" },
  "NXE": { symbol: "NXE", exchange: "US" },
  // Thematic ETFs
  "WRNA": { symbol: "WRNA", exchange: "XETRA" },
  "WTMF": { symbol: "WTMF", exchange: "US" },
  // Crypto
  "IBIT": { symbol: "IBIT", exchange: "US" },
  // Shorts & Hedges
  "3TYS": { symbol: "3TYS", exchange: "XETRA" },
  "XBJA": { symbol: "XBJA", exchange: "XETRA" },
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
