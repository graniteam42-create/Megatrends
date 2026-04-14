// Default performance data - ticker mapping per trend.
// perf20d/perf60d are null until fetched via /api/performance/export.
// Update by visiting that endpoint and pasting the JSON here.

export const DEFAULT_PERFORMANCE: Record<string, { ticker: string; perf20d: number | null; perf60d: number | null }> = {
  "t1":  { ticker: "NVDA",  perf20d: null, perf60d: null },
  "t2":  { ticker: "WGLD",  perf20d: null, perf60d: null },
  "t3":  { ticker: "SPUT",  perf20d: null, perf60d: null },
  "t4":  { ticker: "RARE",  perf20d: null, perf60d: null },
  "t5":  { ticker: "IXJ",   perf20d: null, perf60d: null },
  "t6":  { ticker: "W1TB",  perf20d: null, perf60d: null },
  "t7":  { ticker: "WGLD",  perf20d: null, perf60d: null },
};
