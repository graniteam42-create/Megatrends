import { TICKER_MAP } from "@/lib/ticker-map";

export async function GET() {
  const API_KEY = process.env.EODHD_API_KEY;
  if (!API_KEY) return Response.json({ error: "No API key" });

  const missing = ["OD7C", "WGLD", "WSLV", "U3O8", "3TYS", "XBJA"];
  const results: Record<string, unknown> = {};

  for (const ticker of missing) {
    const mapping = TICKER_MAP[ticker];
    if (!mapping) { results[ticker] = "NOT IN TICKER_MAP"; continue; }

    const url = `https://eodhd.com/api/real-time/${mapping.symbol}.${mapping.exchange}?api_token=${API_KEY}&fmt=json`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      results[ticker] = { url: `${mapping.symbol}.${mapping.exchange}`, status: res.status, data };
    } catch (e: unknown) {
      results[ticker] = { url: `${mapping.symbol}.${mapping.exchange}`, error: e instanceof Error ? e.message : "unknown" };
    }
  }

  // Also try alternative symbols for the missing ones
  const alternatives: Record<string, string[]> = {
    "OD7C": ["OD7C.F", "OD7C.DE", "COPA.XETRA", "COPA.DE"],
    "WGLD": ["WGLD.F", "WGLD.DE", "PHAU.LSE", "PHAU.XETRA"],
    "WSLV": ["WSLV.F", "WSLV.DE", "PHAG.LSE", "PHAG.XETRA"],
    "U3O8": ["U3O8.F", "U3O8.DE", "U308.LSE", "URNU.LSE"],
    "3TYS": ["3TYS.F", "3TYS.DE"],
    "XBJA": ["XBJA.F", "XBJA.DE"],
  };

  const altResults: Record<string, unknown> = {};
  for (const [ticker, alts] of Object.entries(alternatives)) {
    altResults[ticker] = {};
    for (const alt of alts) {
      try {
        const res = await fetch(`https://eodhd.com/api/real-time/${alt}?api_token=${API_KEY}&fmt=json`);
        const data = await res.json();
        const hasPrice = typeof data.close === "number" && data.close > 0;
        (altResults[ticker] as Record<string, unknown>)[alt] = hasPrice ? { close: data.close, change_p: data.change_p } : "no data";
      } catch { (altResults[ticker] as Record<string, unknown>)[alt] = "error"; }
    }
  }

  return new Response(JSON.stringify({ current: results, alternatives: altResults }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
