import type { PriceData } from "../types";

// Default prices hardcoded from last known values (April 2026).
// These are loaded instantly on app start. Click "Refresh Prices" for live data.
// Update these periodically when deploying new versions.

export const DEFAULT_PRICES: Record<string, PriceData> = {
  // === Positions: Physical ETCs (EU-listed) ===
  "SPUT":  { close: 27.50, change_p: 0 },  // Sprott Physical Uranium ETC (LSE)
  "OD7C":  { close: 48.20, change_p: 0 },  // WisdomTree Copper ETC (XETRA)
  "WGLD":  { close: 265.00, change_p: 0 }, // WisdomTree Core Physical Gold (XETRA)
  "WSLV":  { close: 37.80, change_p: 0 },  // WisdomTree Core Physical Silver (XETRA)

  // === Positions: Miner/Sector ETFs ===
  "U3O8":  { close: 16.40, change_p: 0 },  // Sprott Uranium Miners UCITS (LSE)
  "WNUC":  { close: 14.50, change_p: 0 },  // WisdomTree Uranium & Nuclear (XETRA)
  "IXJ":   { close: 86.50, change_p: 0 },  // iShares Global Healthcare (US)
  "RARE":  { close: 38.10, change_p: 0 },  // WisdomTree Strategic Metals (XETRA)
  "GDX":   { close: 45.20, change_p: 0 },  // VanEck Gold Miners (US)
  "W1TB":  { close: 27.30, change_p: 0 },  // WisdomTree Cybersecurity (XETRA)

  // === Positions: Individual Stocks ===
  "CCJ":   { close: 55.80, change_p: 0 },  // Cameco Corp (US)
  "NXE":   { close: 7.85, change_p: 0 },   // NexGen Energy (US)

  // === Positions: Shorts & Hedges ===
  "3TYS":  { close: 3.90, change_p: 0 },   // WisdomTree 3x Short US 10Y (XETRA)
  "XBJA":  { close: 43.50, change_p: 0 },  // WisdomTree Long CHF Short EUR (XETRA)

  // === Crash Watchlist ===
  "ASML":  { close: 680.00, change_p: 0 },  // ASML Holding (US ADR)
  "TSM":   { close: 321.00, change_p: 0 },  // TSMC (US ADR)
  "NVDA":  { close: 166.00, change_p: 0 },  // NVIDIA (US)
  "AVGO":  { close: 297.00, change_p: 0 },  // Broadcom (US)
  "GEV":   { close: 830.00, change_p: 0 },  // GE Vernova (US)
  "ETN":   { close: 342.00, change_p: 0 },  // Eaton Corp (US)
  "PWR":   { close: 555.00, change_p: 0 },  // Quanta Services (US)
  "BWXT":  { close: 197.00, change_p: 0 },  // BWX Technologies (US)
  "FCX":   { close: 36.00, change_p: 0 },   // Freeport-McMoRan (US)
  "OKLO":  { close: 46.00, change_p: 0 },   // Oklo Inc (US)
  "NBIS":  { close: 92.00, change_p: 0 },   // Nebius Group (US)

  // === Market Indicators ===
  "VIX":   { close: 28.50, change_p: 0 },   // CBOE Volatility Index
  "SPY":   { close: 538.00, change_p: 0 },  // S&P 500 ETF
};
