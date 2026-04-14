"use client";

import { useState, useEffect, useCallback } from "react";
import type { Trend, PriceData } from "@/lib/types";
import { SEED_TRENDS, DEFAULT_PRICES, DEFAULT_PERFORMANCE } from "@/lib/seed-data";
import LandscapeTab from "./LandscapeTab";
import AnalysisTab from "./AnalysisTab";
import PositionsTab from "./PositionsTab";
import StrategyLabTab from "./StrategyLabTab";
import VisitLog from "./VisitLog";

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
  const [performance, setPerformance] = useState<Record<string, { ticker: string; perf20d: number | null; perf60d: number | null }>>(DEFAULT_PERFORMANCE);
  const [ready, setReady] = useState(false);
  const [showVisits, setShowVisits] = useState(false);

  const setTrends: typeof setTrendsRaw = useCallback((v) => {
    setTrendsRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      saveLS(LS_TRENDS, next);
      return next;
    });
  }, []);

  const setScans: typeof setScansRaw = useCallback((v) => {
    setScansRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      saveLS(LS_SCANS, next);
      return next;
    });
  }, []);


  // Load persisted data from localStorage (survives deploys), fallback to server
  useEffect(() => {
    const lsTrends = loadLS<Trend[] | null>(LS_TRENDS, null);
    const lsScans = loadLS<Record<string, { result: string; ts: string; model?: string }> | null>(LS_SCANS, null);
    if (lsTrends && lsTrends.length) setTrendsRaw(lsTrends);
    if (lsScans) setScansRaw(lsScans);
    setReady(true);
  }, []);

  // Log visit on first load
  useEffect(() => {
    fetch("/api/visits", { method: "POST" }).catch(() => {});
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
    try { setPricesDate(localStorage.getItem(LS_PRICES + "_date") || ""); } catch {}
  }, []);

  async function refreshPrices() {
    if (pricesDate === today()) {
      setPricesMessage("Latest prices already fetched");
      setTimeout(() => setPricesMessage(""), 3000);
      return;
    }
    setPricesRefreshing(true);
    setPricesMessage("");
    try {
      const [priceRes, perfRes] = await Promise.all([
        fetch("/api/prices"),
        fetch("/api/performance"),
      ]);
      const priceData = await priceRes.json();
      const perfData = await perfRes.json();
      if (priceData && typeof priceData === "object" && !priceData.error) {
        setPrices({ ...DEFAULT_PRICES, ...priceData });
        saveLS(LS_PRICES, priceData);
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
        <div className="relative px-7 pt-7 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-mono text-[32px] font-bold tracking-wider text-[#00e5ff] drop-shadow-[0_0_12px_rgba(0,229,255,0.3)]">THE JAD GAME</h1>
              <p
                className="text-sm text-[#cbd5e1] tracking-[0.2em] uppercase mt-1 cursor-default select-none"
                onClick={() => setShowVisits(true)}
              >Macro Trend Tracker</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={refreshPrices}
                disabled={pricesRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#334155] bg-[#0d1117]/80 backdrop-blur-sm text-[12px] font-mono text-[#cbd5e1] hover:text-[#e0e4ec] hover:border-[#00e5ff66] hover:bg-[#0d1117] transition-colors disabled:opacity-50"
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
      <div className="flex border-b border-[#1e293b] bg-[#0d1117] flex-wrap">
        {TABS.map((t) => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-6 py-3 text-[13px] cursor-pointer font-mono transition-colors ${
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
      <div className="px-7 py-6 max-w-[1400px] mx-auto">
        {tab === "landscape" && <LandscapeTab trends={trends} onSwitchTab={(t, trendId) => { setTab(t); if (trendId) setFocusTrendId(trendId); }} performance={performance} />}
        {tab === "analysis" && <AnalysisTab trends={trends} setTrends={setTrends} scans={scans} setScans={setScans} focusTrendId={focusTrendId} onFocusHandled={() => setFocusTrendId(null)} />}
        {tab === "positions" && <PositionsTab trends={trends} prices={prices} tickerPerf={Object.fromEntries(Object.values(performance).map((p) => [p.ticker, { perf20d: p.perf20d, perf60d: p.perf60d }]))} />}
        {tab === "lab" && <StrategyLabTab trends={trends} setTrends={setTrends} />}
      </div>

      {showVisits && <VisitLog onClose={() => setShowVisits(false)} />}
    </div>
  );
}
