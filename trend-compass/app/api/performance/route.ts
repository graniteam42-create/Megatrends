import { SEED_TRENDS } from "@/lib/seed-data";
import { TICKER_MAP } from "@/lib/ticker-map";
import { fetchHistoricalPerformance } from "@/lib/eodhd";

function extractMainTicker(investmentMap: string): string | null {
  const words = investmentMap.match(/\b[A-Z][A-Z0-9]{1,4}\b/g);
  if (!words) return null;
  return words.find((w) => w in TICKER_MAP) ?? null;
}

export async function GET() {
  const results: Record<string, { ticker: string; perf20d: number | null; perf60d: number | null }> = {};

  const entries = SEED_TRENDS
    .map((t) => ({ id: t.id, ticker: extractMainTicker(t.investmentMap) }))
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

  return Response.json(results);
}
