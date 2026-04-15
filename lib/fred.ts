/**
 * FRED (Federal Reserve Economic Data) API client.
 * Fetches macro indicators directly from the source:
 * - Yield curve (2Y-10Y spread)
 * - Real yields (10Y TIPS)
 * - Credit spreads (BAA-AAA, HY OAS)
 * - Fed Funds rate
 * - Breakeven inflation
 * - M2 money supply growth
 *
 * Requires FRED_API_KEY env var (free at https://fred.stlouisfed.org/docs/api/api_key.html)
 */

const API_KEY = process.env.FRED_API_KEY;
const BASE = "https://api.stlouisfed.org/fred/series/observations";

interface FredObservation {
  date: string;
  value: string;
}

async function fetchSeries(seriesId: string, limit: number = 5): Promise<FredObservation[]> {
  if (!API_KEY) return [];
  try {
    const url = `${BASE}?series_id=${seriesId}&api_key=${API_KEY}&file_type=json&sort_order=desc&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
    if (!res.ok) return [];
    const data = await res.json();
    return (data.observations || []).filter((o: FredObservation) => o.value !== ".");
  } catch {
    return [];
  }
}

function latestValue(obs: FredObservation[]): number | null {
  if (!obs.length) return null;
  const v = parseFloat(obs[0].value);
  return isNaN(v) ? null : v;
}

function previousValue(obs: FredObservation[], offset: number = 1): number | null {
  if (obs.length <= offset) return null;
  const v = parseFloat(obs[offset].value);
  return isNaN(v) ? null : v;
}

export interface FredIndicators {
  yieldCurve2s10s: number | null;       // T10Y2Y — positive = normal, negative = inverted
  yieldCurve2s10sPrev: number | null;
  realYield10Y: number | null;          // DFII10 — 10Y TIPS yield
  realYield10YPrev: number | null;
  creditSpreadBaaAaa: number | null;    // BAA10Y minus AAA10Y (or BAA-AAA spread)
  creditSpreadBaaAaaPrev: number | null;
  hyOAS: number | null;                 // BAMLH0A0HYM2 — ICE BofA HY OAS
  hyOASPrev: number | null;
  fedFundsRate: number | null;          // DFF
  breakeven5Y: number | null;           // T5YIE — 5Y breakeven inflation
  breakeven5YPrev: number | null;
  m2YoY: number | null;                // M2SL — M2 money supply (need to compute YoY)
}

export async function fetchFredIndicators(): Promise<FredIndicators> {
  if (!API_KEY) {
    return {
      yieldCurve2s10s: null, yieldCurve2s10sPrev: null,
      realYield10Y: null, realYield10YPrev: null,
      creditSpreadBaaAaa: null, creditSpreadBaaAaaPrev: null,
      hyOAS: null, hyOASPrev: null,
      fedFundsRate: null,
      breakeven5Y: null, breakeven5YPrev: null,
      m2YoY: null,
    };
  }

  const [
    yc2s10s,        // 10Y-2Y Treasury spread (pre-computed by FRED)
    realYield,      // 10Y TIPS yield
    baaYield,       // Moody's BAA corporate yield
    aaaYield,       // Moody's AAA corporate yield
    hyOAS,          // HY option-adjusted spread
    fedFunds,       // Fed funds rate
    breakeven5Y,    // 5Y breakeven inflation
  ] = await Promise.all([
    fetchSeries("T10Y2Y", 5),       // 10Y-2Y spread
    fetchSeries("DFII10", 5),       // 10Y real yield (TIPS)
    fetchSeries("DBAA", 5),         // Moody's BAA yield
    fetchSeries("DAAA", 5),         // Moody's AAA yield
    fetchSeries("BAMLH0A0HYM2", 5), // ICE BofA HY OAS
    fetchSeries("DFF", 3),          // Fed funds effective rate
    fetchSeries("T5YIE", 5),        // 5Y breakeven inflation
  ]);

  const baaVal = latestValue(baaYield);
  const aaaVal = latestValue(aaaYield);
  const baaPrev = previousValue(baaYield, 4);
  const aaaPrev = previousValue(aaaYield, 4);

  return {
    yieldCurve2s10s: latestValue(yc2s10s),
    yieldCurve2s10sPrev: previousValue(yc2s10s, 4),
    realYield10Y: latestValue(realYield),
    realYield10YPrev: previousValue(realYield, 4),
    creditSpreadBaaAaa: baaVal !== null && aaaVal !== null ? baaVal - aaaVal : null,
    creditSpreadBaaAaaPrev: baaPrev !== null && aaaPrev !== null ? baaPrev - aaaPrev : null,
    hyOAS: latestValue(hyOAS),
    hyOASPrev: previousValue(hyOAS, 4),
    fedFundsRate: latestValue(fedFunds),
    breakeven5Y: latestValue(breakeven5Y),
    breakeven5YPrev: previousValue(breakeven5Y, 4),
    m2YoY: null, // Would need 12mo of monthly data — skip for now
  };
}
