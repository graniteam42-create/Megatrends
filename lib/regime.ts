import { fetchPrice, fetchHistoricalPerformance } from "./eodhd";

export interface RegimeSignal {
  name: string;
  value: number | null;
  interpretation: string;
  score: number; // -2 (very bearish) to +2 (very bullish)
}

export interface RegimeAssessment {
  regime: "CALM" | "CAUTIOUS" | "STRESSED" | "CRISIS";
  overallScore: number; // -2 to +2
  signals: RegimeSignal[];
  summary: string;
  deployableTiers: number[];
  equityCorrelationCap: number; // max % equity-correlated assets
}

async function getPrice(ticker: string): Promise<number | null> {
  const p = await fetchPrice(ticker);
  return p?.close ?? null;
}

async function getPerf(ticker: string, days: number): Promise<number | null> {
  return fetchHistoricalPerformance(ticker, days);
}

export async function computeRegime(): Promise<RegimeAssessment> {
  // Fetch all indicators in parallel
  const [
    vix, spy20d, spy60d,
    tlt20d, hyg20d, lqd20d,
    gld20d, gld60d,
    tipPrice, tltPrice,
    btc20d, spy20dPerf,
    copx20d, rsp20d,
    spyPrice, rspPrice,
    uup20d, xle20d,
  ] = await Promise.all([
    getPrice("VIX"),
    getPerf("SPY", 20),
    getPerf("SPY", 60),
    getPerf("TLT", 20),
    getPerf("HYG", 20),
    getPerf("LQD", 20),
    getPerf("GLD", 20),
    getPerf("GLD", 60),
    getPrice("TIPS"),
    getPrice("TLT"),
    getPerf("BTC", 20),
    getPerf("SPY", 20),
    getPerf("COPX", 20),
    getPerf("RSP", 20),
    getPrice("SPY"),
    getPrice("RSP"),
    getPerf("UUP", 20),
    getPerf("XLE", 20),
  ]);

  const signals: RegimeSignal[] = [];

  // 1. VIX — Volatility regime
  if (vix !== null) {
    let score: number;
    let interp: string;
    if (vix < 15) { score = 1.5; interp = "Complacency — low vol, calm markets"; }
    else if (vix < 20) { score = 0.5; interp = "Normal — moderate vol"; }
    else if (vix < 25) { score = -0.5; interp = "Elevated — caution warranted"; }
    else if (vix < 30) { score = -1; interp = "Stressed — correction territory"; }
    else if (vix < 40) { score = -1.5; interp = "High stress — deploy T2 miners"; }
    else { score = -2; interp = "Crisis — deploy everything, buy crash watchlist"; }
    signals.push({ name: "VIX (Volatility)", value: vix, interpretation: interp, score });
  }

  // 2. S&P 500 momentum — trend strength
  if (spy20d !== null) {
    let score: number;
    let interp: string;
    if (spy20d > 5) { score = 1.5; interp = `Strong rally +${spy20d.toFixed(1)}% in 20d`; }
    else if (spy20d > 0) { score = 0.5; interp = `Modest gains +${spy20d.toFixed(1)}% in 20d`; }
    else if (spy20d > -5) { score = -0.5; interp = `Mild weakness ${spy20d.toFixed(1)}% in 20d`; }
    else if (spy20d > -15) { score = -1.5; interp = `Correction ${spy20d.toFixed(1)}% in 20d — approaching buy zone for T2`; }
    else { score = -2; interp = `Crash ${spy20d.toFixed(1)}% in 20d — deploy crash watchlist`; }
    signals.push({ name: "S&P 500 Momentum (20d)", value: spy20d, interpretation: interp, score });
  }

  // 3. Credit spreads — HYG vs LQD divergence
  if (hyg20d !== null && lqd20d !== null) {
    const spread = hyg20d - lqd20d; // if HY underperforms IG, stress is real
    let score: number;
    let interp: string;
    if (spread > 1) { score = 1; interp = "Risk appetite — HY outperforming IG"; }
    else if (spread > -1) { score = 0; interp = "Neutral credit conditions"; }
    else if (spread > -3) { score = -1; interp = "Credit stress emerging — HY underperforming IG"; }
    else { score = -2; interp = "Severe credit stress — risk of contagion"; }
    signals.push({ name: "Credit Spread (HYG-LQD 20d)", value: +spread.toFixed(2), interpretation: interp, score });
  }

  // 4. Gold momentum — debasement/fear signal
  if (gld20d !== null) {
    let score: number;
    let interp: string;
    if (gld20d > 5) { score = -1; interp = `Gold surging +${gld20d.toFixed(1)}% — fear/debasement accelerating, overweight physical`; }
    else if (gld20d > 0) { score = 0; interp = `Gold grinding higher +${gld20d.toFixed(1)}% — steady debasement`; }
    else if (gld20d > -5) { score = 0.5; interp = `Gold pulling back ${gld20d.toFixed(1)}% — accumulation opportunity`; }
    else { score = 1; interp = `Gold correcting hard ${gld20d.toFixed(1)}% — strong buy for long-term`; }
    signals.push({ name: "Gold Momentum (20d)", value: gld20d, interpretation: interp, score });
  }

  // 5. Dollar strength — headwind for commodities, EM pressure
  if (uup20d !== null) {
    let score: number;
    let interp: string;
    if (uup20d > 2) { score = -1; interp = `Dollar strengthening +${uup20d.toFixed(1)}% — commodity headwind, EM risk`; }
    else if (uup20d > -1) { score = 0; interp = "Dollar stable"; }
    else if (uup20d > -3) { score = 0.5; interp = `Dollar weakening ${uup20d.toFixed(1)}% — commodity tailwind`; }
    else { score = 1; interp = `Dollar dropping ${uup20d.toFixed(1)}% — strong commodity/EM tailwind`; }
    signals.push({ name: "Dollar Trend (UUP 20d)", value: uup20d, interpretation: interp, score });
  }

  // 6. Copper/Gold ratio trend — growth vs fear
  if (copx20d !== null && gld20d !== null) {
    const ratio = copx20d - gld20d;
    let score: number;
    let interp: string;
    if (ratio > 5) { score = 1.5; interp = "Growth leadership — copper outpacing gold by wide margin"; }
    else if (ratio > 0) { score = 0.5; interp = "Growth tilting up — copper gaining vs gold"; }
    else if (ratio > -5) { score = -0.5; interp = "Fear tilting up — gold outpacing copper"; }
    else { score = -1.5; interp = "Fear dominant — gold massively outperforming copper (recessionary)"; }
    signals.push({ name: "Copper/Gold Ratio Trend", value: +ratio.toFixed(1), interpretation: interp, score });
  }

  // 7. Market breadth — SPY vs RSP (cap-weighted vs equal-weight)
  if (spy20d !== null && rsp20d !== null) {
    const breadthGap = rsp20d - spy20d;
    let score: number;
    let interp: string;
    if (breadthGap > 2) { score = 1; interp = "Broad participation — healthy rally, equal-weight leading"; }
    else if (breadthGap > -2) { score = 0; interp = "Neutral breadth"; }
    else if (breadthGap > -5) { score = -0.5; interp = "Narrow market — few stocks driving gains, fragile"; }
    else { score = -1.5; interp = "Very narrow — mega-cap only, high reversal risk"; }
    signals.push({ name: "Market Breadth (RSP-SPY)", value: +breadthGap.toFixed(1), interpretation: interp, score });
  }

  // 8. Bond duration signal — TLT trend
  if (tlt20d !== null) {
    let score: number;
    let interp: string;
    if (tlt20d > 3) { score = -0.5; interp = `Bonds rallying +${tlt20d.toFixed(1)}% — flight to safety / rate cut expectations`; }
    else if (tlt20d > -2) { score = 0; interp = "Bonds stable"; }
    else if (tlt20d > -5) { score = 0.5; interp = `Bonds selling off ${tlt20d.toFixed(1)}% — confirms financial repression short-bonds thesis`; }
    else { score = -1; interp = `Bond rout ${tlt20d.toFixed(1)}% — fiscal dominance signal, confirms t2 thesis strongly`; }
    signals.push({ name: "Treasury Duration (TLT 20d)", value: tlt20d, interpretation: interp, score });
  }

  // 9. Bitcoin risk correlation
  if (btc20d !== null && spy20d !== null) {
    const correlation = (btc20d > 0 && spy20d > 0) || (btc20d < 0 && spy20d < 0) ? "correlated" : "decorrelated";
    let score: number;
    let interp: string;
    if (correlation === "correlated" && btc20d > 0) { score = 0.5; interp = `BTC +${btc20d.toFixed(1)}% moving with equities — risk-on regime`; }
    else if (correlation === "correlated" && btc20d < 0) { score = -1; interp = `BTC ${btc20d.toFixed(1)}% falling with equities — risk-off, BTC not a hedge`; }
    else if (btc20d > 0) { score = 0; interp = `BTC +${btc20d.toFixed(1)}% while equities fall — possible safe haven behavior`; }
    else { score = -0.5; interp = `BTC ${btc20d.toFixed(1)}% falling while equities rise — crypto-specific weakness`; }
    signals.push({ name: "Bitcoin Risk Correlation", value: btc20d, interpretation: interp, score });
  }

  // 10. Energy sector — inflation/supply signal
  if (xle20d !== null) {
    let score: number;
    let interp: string;
    if (xle20d > 5) { score = -0.5; interp = `Energy surging +${xle20d.toFixed(1)}% — inflationary, supports commodity thesis`; }
    else if (xle20d > -2) { score = 0; interp = "Energy sector stable"; }
    else if (xle20d > -10) { score = 0.5; interp = `Energy weak ${xle20d.toFixed(1)}% — deflationary signal, reduces urgency on inflation hedges`; }
    else { score = -1; interp = `Energy crashing ${xle20d.toFixed(1)}% — demand destruction, recessionary`; }
    signals.push({ name: "Energy Sector (XLE 20d)", value: xle20d, interpretation: interp, score });
  }

  // Compute overall regime
  const validSignals = signals.filter((s) => s.value !== null);
  const overallScore = validSignals.length > 0
    ? validSignals.reduce((sum, s) => sum + s.score, 0) / validSignals.length
    : 0;

  let regime: RegimeAssessment["regime"];
  let deployableTiers: number[];
  let equityCorrelationCap: number;

  if (overallScore > 0.5) {
    regime = "CALM";
    deployableTiers = [1, 4]; // Physical + hedges only
    equityCorrelationCap = 30;
  } else if (overallScore > -0.3) {
    regime = "CAUTIOUS";
    deployableTiers = [1, 4]; // Physical + hedges, start watching T2
    equityCorrelationCap = 35;
  } else if (overallScore > -1) {
    regime = "STRESSED";
    deployableTiers = [1, 2, 4]; // Add miners
    equityCorrelationCap = 50;
  } else {
    regime = "CRISIS";
    deployableTiers = [1, 2, 3, 4]; // Everything, including crash watchlist
    equityCorrelationCap = 60;
  }

  // Build summary
  const bearSignals = validSignals.filter((s) => s.score < -0.5).map((s) => s.name);
  const bullSignals = validSignals.filter((s) => s.score > 0.5).map((s) => s.name);

  let summary = `Market regime: ${regime} (composite score ${overallScore.toFixed(2)}, ${validSignals.length} indicators). `;
  if (bearSignals.length > 0) summary += `Bearish signals: ${bearSignals.join(", ")}. `;
  if (bullSignals.length > 0) summary += `Bullish signals: ${bullSignals.join(", ")}. `;
  summary += `Deploy tiers: ${deployableTiers.join(", ")}. Equity-correlated cap: ${equityCorrelationCap}%.`;

  return {
    regime,
    overallScore,
    signals,
    summary,
    deployableTiers,
    equityCorrelationCap,
  };
}
