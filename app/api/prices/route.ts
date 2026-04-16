import { fetchAllPrices, fetchAll52WeekHighs } from "@/lib/eodhd";
import { CRASH_WATCHLIST } from "@/lib/seed-data";

export async function GET() {
  try {
    const prices = await fetchAllPrices();

    // Also fetch 52-week highs for crash watchlist tickers
    const watchlistTickers = CRASH_WATCHLIST.map((w) => w.ticker);
    const highs = await fetchAll52WeekHighs(watchlistTickers);

    return Response.json({ prices, highs });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
