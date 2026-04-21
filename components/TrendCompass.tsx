"use client";

import { useState, useEffect, useCallback } from "react";
import type { Trend, PriceData } from "@/lib/types";
import { SEED_TRENDS, DEFAULT_PRICES, DEFAULT_PERFORMANCE, POSITIONS, CRASH_WATCHLIST } from "@/lib/seed-data";
import { extractBenchmarkTicker } from "@/lib/ticker-map";
import LandscapeTab from "./LandscapeTab";
import AnalysisTab from "./AnalysisTab";
import PositionsTab from "./PositionsTab";
import StrategyLabTab from "./StrategyLabTab";
import { ErrorBoundary } from "./ErrorBoundary";

const TABS = [
  { id: "landscape", label: "Landscape" },
  { id: "analysis", label: "Analysis" },
  { id: "positions", label: "Positions" },
  { id: "lab", label: "Strategy Lab" },
];

const LS_TRENDS = "tc_trends";
const LS_SCANS = "tc_scans";
const LS_PRICES = "tc_prices";
const LS_PERF = "tc_perf";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// Legacy trends (pre-2026-04-21) sometimes stored investmentMap as an array
// of {ticker, position} objects returned by the AI. Normalize to string on
// load so old localStorage data no longer crashes React.
function coerceInvestmentMap(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((e) => {
        if (typeof e === "string") return e;
        if (e && typeof e === "object") {
          const o = e as Record<string, unknown>;
          const ticker = o.ticker || o.symbol || o.name;
          const position = o.position || o.side || o.direction;
          if (ticker && position) return `${position}: ${ticker}`;
          if (ticker) return String(ticker);
          return JSON.stringify(e);
        }
        return String(e);
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof raw === "object") {
    try { return JSON.stringify(raw); } catch { return ""; }
  }
  return String(raw);
}

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function saveLS(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export default function TrendCompass() {
  const [tab, setTab] = useState("landscape");
  const [focusTrendId, setFocusTrendId] = useState<string | null>(null);
  const [trends, setTrendsRaw] = useState<Trend[]>(SEED_TRENDS);
  const [scans, setScansRaw] = useState<Record<string, { result: string; ts: string; model?: string }>>({});
  const [prices, setPrices] = useState<Record<string, PriceData>>(DEFAULT_PRICES);
  const [highs, setHighs] = useState<Record<string, number>>({});
  const [performance, setPerformance] = useState<Record<string, { ticker: string; perf20d: number | null; perf60d: number | null }>>(DEFAULT_PERFORMANCE);
  const [ready, setReady] = useState(false);

  const setTrends: typeof setTrendsRaw = useCallback((v) => {
    setTrendsRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      saveLS(LS_TRENDS, next);
      // Also sync to server for persistence across deploys
      fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const setScans: typeof setScansRaw = useCallback((v) => {
    setScansRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      saveLS(LS_SCANS, next);
      // Sync to server (KV) for persistence across deploys
      fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);


  // Load persisted data: try localStorage first, then server
  useEffect(() => {
    const lsTrends = loadLS<Trend[] | null>(LS_TRENDS, null);
    const lsScans = loadLS<Record<string, { result: string; ts: string; model?: string }> | null>(LS_SCANS, null);

    if (lsTrends && lsTrends.length) {
      // Migrate legacy trends:
      // 1. Coerce investmentMap to string (AI sometimes returned structured JSON,
      //    which crashed React #31 when rendered as a child).
      // 2. Auto-populate benchmarkTicker if missing.
      const migrated = lsTrends.map((t: Trend) => {
        const next: Trend = { ...t };
        if (next.investmentMap != null && typeof next.investmentMap !== "string") {
          next.investmentMap = coerceInvestmentMap(next.investmentMap);
        }
        if (!Array.isArray(next.subTrends)) {
          next.subTrends = [];
        }
        if (!next.benchmarkTicker && typeof next.investmentMap === "string") {
          next.benchmarkTicker = extractBenchmarkTicker(next.investmentMap);
        }
        return next;
      });
      setTrendsRaw(migrated);
      saveLS(LS_TRENDS, migrated);
      setReady(true);
    } else {
      // localStorage empty (new browser/cleared cache) — try server
      fetch("/api/trends")
        .then((r) => r.json())
        .then((serverTrends) => {
          if (Array.isArray(serverTrends) && serverTrends.length) {
            const migrated = serverTrends.map((t: Trend) => {
              const next: Trend = { ...t };
              if (next.investmentMap != null && typeof next.investmentMap !== "string") {
                next.investmentMap = coerceInvestmentMap(next.investmentMap);
              }
              if (!Array.isArray(next.subTrends)) next.subTrends = [];
              return next;
            });
            setTrendsRaw(migrated);
            saveLS(LS_TRENDS, migrated);
          }
        })
        .catch(() => {})
        .finally(() => setReady(true));
    }
    if (lsScans && Object.keys(lsScans).length) {
      setScansRaw(lsScans);
    } else {
      // Try loading scans from server too
      fetch("/api/scans").then((r) => r.json()).then((serverScans) => {
        if (serverScans && Object.keys(serverScans).length) {
          setScansRaw(serverScans);
          saveLS(LS_SCANS, serverScans);
        }
      }).catch(() => {});
    }
    if (lsTrends && lsTrends.length) setReady(true);
  }, []);

  // Load cached prices from localStorage (manual refresh only)
  const [pricesDate, setPricesDate] = useState("");
  const [pricesRefreshing, setPricesRefreshing] = useState(false);
  const [pricesMessage, setPricesMessage] = useState("");

  useEffect(() => {
    // Merge cached live prices on top of hardcoded defaults
    const cached = loadLS<Record<string, PriceData> | null>(LS_PRICES, null);
    if (cached && Object.keys(cached).length) setPrices({ ...DEFAULT_PRICES, ...cached });
    const cachedPerf = loadLS<Record<string, { ticker: string; perf20d: number | null; perf60d: number | null }> | null>(LS_PERF, null);
    if (cachedPerf && Object.keys(cachedPerf).length) setPerformance({ ...DEFAULT_PERFORMANCE, ...cachedPerf });
    const cachedHighs = loadLS<Record<string, number> | null>("tc_highs", null);
    if (cachedHighs && Object.keys(cachedHighs).length) setHighs(cachedHighs);
    try { setPricesDate(localStorage.getItem(LS_PRICES + "_date") || ""); } catch {}
  }, []);

  async function refreshPrices() {
    // Check if any trends are missing performance data
    const hasMissingPerf = trends.some((t) => t.benchmarkTicker && !performance[t.id]);
    if (pricesDate === today() && !hasMissingPerf) {
      setPricesMessage("Latest prices already fetched");
      setTimeout(() => setPricesMessage(""), 3000);
      return;
    }
    setPricesRefreshing(true);
    setPricesMessage("");
    try {
      // Include position & watchlist tickers alongside trends so they get perf data
      const positionTickers = [...new Set([
        ...POSITIONS.map((p) => p.ticker),
        ...CRASH_WATCHLIST.map((w) => w.ticker),
      ])];
      const tickerEntries = positionTickers
        .filter((tk) => !trends.some((t) => t.benchmarkTicker === tk))
        .map((tk) => ({ id: `pos_${tk}`, name: tk, benchmarkTicker: tk, investmentMap: "", stage: 0, horizon: "", confidence: 0, description: "", subTrends: [], signals: [], thesis: "", bearCase: "", mispricingScore: 0 }));
      const allForPerf = [...trends, ...tickerEntries];

      const [priceRes, perfRes] = await Promise.all([
        fetch("/api/prices"),
        fetch("/api/performance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(allForPerf),
        }),
      ]);
      const priceResponse = await priceRes.json();
      const perfData = await perfRes.json();
      // Handle both old format (flat price map) and new format ({ prices, highs })
      const priceData = priceResponse.prices || priceResponse;
      const highsData = priceResponse.highs || {};
      if (priceData && typeof priceData === "object" && !priceData.error) {
        setPrices({ ...DEFAULT_PRICES, ...priceData });
        saveLS(LS_PRICES, priceData);
      }
      if (highsData && Object.keys(highsData).length) {
        setHighs(highsData);
        saveLS("tc_highs", highsData);
      }
      if (perfData && typeof perfData === "object" && !perfData.error) {
        setPerformance({ ...DEFAULT_PERFORMANCE, ...perfData });
        saveLS(LS_PERF, perfData);
      }
      const d = today();
      try { localStorage.setItem(LS_PRICES + "_date", d); localStorage.setItem(LS_PERF + "_date", d); } catch {}
      setPricesDate(d);
    } catch {}
    setPricesRefreshing(false);
  }

  return (
    <div className="font-sans bg-[#0a0c10] text-[#e0e4ec] min-h-screen">
      {/* Header with compass banner */}
      <div className="border-b border-[#1e293b] relative overflow-hidden">
        <img
          src="/compass-banner.svg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1117] via-[#0d1117cc] to-[#0d111700] pointer-events-none" />
        <div className="relative px-4 sm:px-7 pt-5 sm:pt-7 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="font-mono text-[22px] sm:text-[32px] font-bold tracking-wider text-[#00e5ff] drop-shadow-[0_0_12px_rgba(0,229,255,0.3)]">TREND COMPASS</h1>
              <p className="text-xs sm:text-sm text-[#cbd5e1] tracking-[0.2em] uppercase mt-1">Macro Trend Tracker</p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1">
              <button
                onClick={refreshPrices}
                disabled={pricesRefreshing}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md border border-[#334155] bg-[#0d1117]/80 backdrop-blur-sm text-[11px] sm:text-[12px] font-mono text-[#cbd5e1] hover:text-[#e0e4ec] hover:border-[#00e5ff66] hover:bg-[#0d1117] transition-colors disabled:opacity-50"
              >
                <span className={pricesRefreshing ? "animate-spin" : ""}>&#x21bb;</span>
                {pricesRefreshing ? "Refreshing..." : pricesDate ? `Prices: ${pricesDate}` : "Fetch Prices"}
              </button>
              {pricesMessage && (
                <span className="text-[11px] font-mono text-[#ffea00] animate-fadeIn">{pricesMessage}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[#1e293b] bg-[#0d1117] overflow-x-auto">
        {TABS.map((t) => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 sm:px-6 py-3 text-[12px] sm:text-[13px] cursor-pointer font-mono transition-colors whitespace-nowrap flex-shrink-0 ${
              tab === t.id
                ? "text-[#00e5ff] font-semibold border-b-2 border-[#00e5ff] bg-[rgba(0,229,255,0.04)]"
                : "text-[#94a3b8] border-b-2 border-transparent hover:text-[#cbd5e1]"
            }`}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="px-3 sm:px-7 py-4 sm:py-6 max-w-[1400px] mx-auto">
        {tab === "landscape" && (
          <ErrorBoundary label="Landscape">
            <LandscapeTab trends={trends} onSwitchTab={(t, trendId) => { setTab(t); if (trendId) setFocusTrendId(trendId); }} performance={performance} />
          </ErrorBoundary>
        )}
        {tab === "analysis" && (
          <ErrorBoundary label="Analysis">
            <AnalysisTab trends={trends} setTrends={setTrends} scans={scans} setScans={setScans} focusTrendId={focusTrendId} onFocusHandled={() => setFocusTrendId(null)} />
          </ErrorBoundary>
        )}
        {tab === "positions" && (
          <ErrorBoundary label="Positions">
            <PositionsTab trends={trends} prices={prices} highs={highs} tickerPerf={Object.fromEntries(Object.values(performance).map((p) => [p.ticker, { perf20d: p.perf20d, perf60d: p.perf60d }]))} />
          </ErrorBoundary>
        )}
        {tab === "lab" && (
          <ErrorBoundary label="Strategy Lab">
            <StrategyLabTab trends={trends} setTrends={setTrends} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
