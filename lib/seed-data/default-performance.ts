// Live performance data as of 2026-04-14. Update by visiting /api/performance/export

export const DEFAULT_PERFORMANCE: Record<string, { ticker: string; perf20d: number | null; perf60d: number | null }> = {
  "t1":  { ticker: "NVDA",  perf20d: 3.32,   perf60d: 1.21 },
  "t2":  { ticker: "WGLD",  perf20d: -8.81,  perf60d: 1.59 },
  "t3":  { ticker: "SPUT",  perf20d: 0.77,   perf60d: -5.18 },
  "t4":  { ticker: "RARE",  perf20d: 6.60,   perf60d: 5.62 },
  "t5":  { ticker: "IXJ",   perf20d: -0.29,  perf60d: -4.22 },
  "t6":  { ticker: "W1TB",  perf20d: -12.45, perf60d: -15.29 },
  "t7":  { ticker: "WGLD",  perf20d: -8.81,  perf60d: 1.59 },
  "t8":  { ticker: "CRSP",  perf20d: -4.53,  perf60d: -12.17 },
  "t9":  { ticker: "EWW",   perf20d: 2.89,   perf60d: 5.44 },
  "t10": { ticker: "OXY",   perf20d: -9.71,  perf60d: -22.35 },
};
