import { fetchAllPrices, fetchAll52WeekHighs } from "@/lib/eodhd";
import { logger } from "@/lib/logger";
import { CRASH_WATCHLIST } from "@/lib/seed-data";

export async function GET() {
  try {
    const watchlistTickers = CRASH_WATCHLIST.map((w) => w.ticker);
    const [prices, highs] = await Promise.all([
      fetchAllPrices(),
      fetchAll52WeekHighs(watchlistTickers),
    ]);
    return Response.json({ prices, highs });
  } catch (e: unknown) {
    logger.error("prices fetch failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    return Response.json({ error: "Price fetch failed" }, { status: 500 });
  }
}
