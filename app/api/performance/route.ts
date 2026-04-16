import { SEED_TRENDS } from "@/lib/seed-data";
import { TICKER_MAP } from "@/lib/ticker-map";
import { fetchHistoricalPerformance } from "@/lib/eodhd";
import { logger } from "@/lib/logger";
import type { Trend } from "@/lib/types";

function extractMainTicker(investmentMap: string): string | null {
  const words = investmentMap.match(/\b[A-Z][A-Z0-9]{1,4}\b/g);
  if (!words) return null;
  return words.find((w) => w in TICKER_MAP) ?? null;
}

function getTicker(trend: Trend): string | null {
  if (trend.benchmarkTicker) return trend.benchmarkTicker;
  return extractMainTicker(trend.investmentMap);
}

async function computePerformance(trends: Trend[]) {
  const results: Record<string, { ticker: string; perf20d: number | null; perf60d: number | null }> = {};

  const entries = trends
    .map((t) => ({ id: t.id, ticker: getTicker(t) }))
    .filter((e): e is { id: string; ticker: string } => e.ticker !== null);

  // All trend fetches run concurrently. fetchHistoricalPerformance already
  // caches via Next's revalidate, so this is bounded by EODHD's limits but
  // dramatically faster than the previous batch-of-3 loop.
  await Promise.all(
    entries.map(async ({ id, ticker }) => {
      const [perf20d, perf60d] = await Promise.all([
        fetchHistoricalPerformance(ticker, 20),
        fetchHistoricalPerformance(ticker, 60),
      ]);
      results[id] = { ticker, perf20d, perf60d };
    })
  );

  return results;
}

export async function GET() {
  const results = await computePerformance(SEED_TRENDS);
  return Response.json(results);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const trends: Trend[] = Array.isArray(body) ? body : body.trends;
    if (!trends || !trends.length) return Response.json({});
    const results = await computePerformance(trends);
    return Response.json(results);
  } catch (e) {
    logger.warn("performance POST parse failed, falling back to seed", {
      error: e instanceof Error ? e.message : String(e),
    });
    const results = await computePerformance(SEED_TRENDS);
    return Response.json(results);
  }
}
