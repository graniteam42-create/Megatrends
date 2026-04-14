import type { PriceData } from "../types";

// Live prices as of 2026-04-14. Update by visiting /api/prices/export
// Tickers without EODHD real-time data use estimates marked with volume: 0.

export const DEFAULT_PRICES: Record<string, PriceData> = {
  // === Positions: Physical ETCs (EU-listed) ===
  "SPUT":  { close: 10.65, change_p: 2.11, volume: 5862, previousClose: 10.43 },
  "OD7C":  { close: 48.20, change_p: 0, volume: 0 },     // No EODHD real-time available
  "WGLD":  { close: 443.00, change_p: 1.43 },            // via PHAU.LSE
  "WSLV":  { close: 70.63, change_p: 4.92 },             // via PHAG.LSE

  // === Positions: Miner/Sector ETFs ===
  "U3O8":  { close: 32.44, change_p: 3.92 },             // via URNU.LSE
  "WNUC":  { close: 53.86, change_p: 3.12, volume: 7491, previousClose: 52.23 },
  "IXJ":   { close: 95.02, change_p: 0.47, volume: 50378, previousClose: 94.58 },
  "RARE":  { close: 54.98, change_p: 1.59, volume: 15939, previousClose: 54.12 },
  "GDX":   { close: 98.82, change_p: -0.57, volume: 11613308, previousClose: 99.39 },
  "W1TB":  { close: 20.105, change_p: 1.35, volume: 6577, previousClose: 19.838 },

  // === Positions: Individual Stocks ===
  "CCJ":   { close: 116.69, change_p: 0.56, volume: 2252900, previousClose: 116.04 },
  "NXE":   { close: 11.865, change_p: 4.17, volume: 3741187, previousClose: 11.39 },

  // === Positions: Shorts & Hedges ===
  "3TYS":  { close: 3.90, change_p: 0, volume: 0 },      // No EODHD real-time available
  "XBJA":  { close: 61.58, change_p: 0, volume: 0 },     // From XETRA previousClose

  // === Crash Watchlist ===
  "ASML":  { close: 1500.20, change_p: 1.48, volume: 1677992, previousClose: 1478.28 },
  "TSM":   { close: 369.71, change_p: -0.24, volume: 8588279, previousClose: 370.60 },
  "NVDA":  { close: 189.31, change_p: 0.36, volume: 126951527, previousClose: 188.63 },
  "AVGO":  { close: 379.75, change_p: 2.21, volume: 22464763, previousClose: 371.55 },
  "GEV":   { close: 991.44, change_p: 0.01, volume: 1382642, previousClose: 991.32 },
  "ETN":   { close: 403.51, change_p: 0.13, volume: 1452914, previousClose: 403.00 },
  "PWR":   { close: 595.78, change_p: 1.78, volume: 762204, previousClose: 585.36 },
  "BWXT":  { close: 232.85, change_p: 1.43, volume: 544532, previousClose: 229.57 },
  "FCX":   { close: 68.03, change_p: 0.34, volume: 12780292, previousClose: 67.80 },
  "OKLO":  { close: 53.90, change_p: 7.26, volume: 7022542, previousClose: 50.25 },
  "NBIS":  { close: 154.56, change_p: 6.62, volume: 23130920, previousClose: 144.97 },

  // === Market Indicators ===
  "VIX":   { close: 18.20, change_p: -4.81, volume: 0, previousClose: 19.12 },
  "SPY":   { close: 686.13, change_p: 0.98, volume: 46194365, previousClose: 679.46 },
};
