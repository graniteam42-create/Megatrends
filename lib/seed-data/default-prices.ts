import type { PriceData } from "../types";

// Live EOD closing prices as of 2026-04-14. Update by visiting /api/prices/export

export const DEFAULT_PRICES: Record<string, PriceData> = {
  // === Positions: Physical ETCs ===
  "SPUT":  { close: 10.43, change_p: 1.36, volume: 11409, previousClose: 10.29 },
  "OD7C":  { close: 48.20, change_p: 0, volume: 0 },  // Not on EODHD
  "WGLD":  { close: 399.76, change_p: -1.06, volume: 2268, previousClose: 404.04 },
  "WSLV":  { close: 63.01, change_p: -2.92, volume: 11785, previousClose: 64.91 },

  // === Positions: Miner/Sector ETFs ===
  "WNUC":  { close: 52.23, change_p: -1.19, volume: 8537, previousClose: 52.86 },
  "IXJ":   { close: 95.00, change_p: 0.44, volume: 50378, previousClose: 94.58 },
  "RARE":  { close: 54.12, change_p: 1.71, volume: 12870, previousClose: 53.21 },
  "GDX":   { close: 98.78, change_p: -0.61, volume: 12426975, previousClose: 99.39 },
  "W1TB":  { close: 19.838, change_p: 3.96, volume: 14475, previousClose: 19.082 },

  // === Positions: Individual Stocks ===
  "CCJ":   { close: 116.70, change_p: 0.57, volume: 2644295, previousClose: 116.04 },
  "NXE":   { close: 11.86, change_p: 4.13, volume: 4670172, previousClose: 11.39 },

  // === Positions: Crypto ===
  "IBIT":  { close: 52.81, change_p: 0.84, volume: 42518730, previousClose: 52.37 },

  // === Crash Watchlist ===
  "ASML":  { close: 1500.20, change_p: 1.48, volume: 1704775, previousClose: 1478.28 },
  "TSM":   { close: 369.57, change_p: -0.28, volume: 8588279, previousClose: 370.60 },
  "NVDA":  { close: 189.31, change_p: 0.36, volume: 133648180, previousClose: 188.63 },
  "AVGO":  { close: 379.75, change_p: 2.21, volume: 23294446, previousClose: 371.55 },
  "GEV":   { close: 991.12, change_p: -0.02, volume: 1626399, previousClose: 991.32 },
  "ETN":   { close: 403.36, change_p: 0.09, volume: 1816683, previousClose: 403.00 },
  "PWR":   { close: 595.84, change_p: 1.79, volume: 1022148, previousClose: 585.36 },
  "BWXT":  { close: 232.83, change_p: 1.42, volume: 672075, previousClose: 229.57 },
  "FCX":   { close: 68.03, change_p: 0.34, volume: 13131100, previousClose: 67.80 },
  "OKLO":  { close: 53.94, change_p: 7.34, volume: 7043681, previousClose: 50.25 },
  "NBIS":  { close: 154.56, change_p: 6.62, volume: 23130920, previousClose: 144.97 },

  // === Market Indicators ===
  "VIX":   { close: 18.15, change_p: -5.07, volume: 0, previousClose: 19.12 },
  "SPY":   { close: 686.10, change_p: 0.98, volume: 53737879, previousClose: 679.46 },
};
