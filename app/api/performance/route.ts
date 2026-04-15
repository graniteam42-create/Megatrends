import { SEED_TRENDS } from "@/lib/seed-data";
import { TICKER_MAP } from "@/lib/ticker-map";
import { fetchHistoricalPerformance } from "@/lib/eodhd";
import type { Trend } from "@/lib/types";

function extractMainTicker(investmentMap: string): string | null {
  const words = investmentMap.match(/\b[A-Z][A-Z0-9]{1,4}\b/g);
  if (!words) return null;
  return words.find((w) => w in TICKER_MAP) ?? null;
}

function getTicker(trend: Trend): string | null {
  // Prefer explicit benchmarkTicker, fall back to extraction from investmentMap
  if (trend.benchmarkTicker && trend.benchmarkTicker in TICKER_MAP) {
    return trend.benchmarkTicker;
  }
  return extractMainTicker(trend.investmentMap);
}

async function computePerformance(trends: Trend[]) {
  const results: Record<string, { ticker: string; perf20d: number | null; perf60d: number | null }> = {};

  const entries = trends
    .map((t) => ({ id: t.id, ticker: getTicker(t) }))
    .filter((e): e is { id: string; ticker: string } => e.ticker !== null);

  for (let i = 0; i < entries.length; i += 3) {
    const batch = entries.slice(i, i + 3);
    await Promise.all(
      batch.map(async ({ id, ticker }) => {
        const [perf20d, perf60d] = await Promise.all([
          fetchHistoricalPerformance(ticker, 20),
          fetchHistoricalPerformance(ticker, 60),
        ]);
        results[id] = { ticker, perf20d, perf60d };
      })
    );
  }

  return results;
}

// GET: Compute performance for seed trends only (backward compat)
export async function GET() {
  const results = await computePerformance(SEED_TRENDS);
  return Response.json(results);
}

// POST: Compute performance for ALL provided trends (including user-added)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const trends: Trend[] = Array.isArray(body) ? body : body.trends;
    if (!trends || !trends.length) {
      return Response.json({});
    }
    const results = await computePerformance(trends);
    return Response.json(results);
  } catch {
    // Fall back to seed trends on parse error
    const results = await computePerformance(SEED_TRENDS);
    return Response.json(results);
  }
}
