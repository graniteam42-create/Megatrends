"use client";

import { useState, useEffect, useCallback } from "react";
import type { Trend, PriceData } from "@/lib/types";
import { SEED_TRENDS, STAGES, DEFAULT_PRICES, DEFAULT_PERFORMANCE } from "@/lib/seed-data";
import LandscapeTab from "./LandscapeTab";
import AnalysisTab from "./AnalysisTab";
import PositionsTab from "./PositionsTab";
import StrategyLabTab from "./StrategyLabTab";

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

  // AI modal state (shared across all tabs)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiModalTitle, setAiModalTitle] = useState("");

  async function runAI(title: string, system: string, prompt: string, tier: "scan" | "synthesis") {
    setAiModalTitle(title);
    setAiLoading(true);
    setAiResult("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, prompt, tier }),
      });
      const data = await res.json();
      setAiResult(data.error ? "Error: " + data.error : data.result);
      setAiModel(data.model || "");
    } catch (e: unknown) {
      setAiResult("Error: " + (e instanceof Error ? e.message : "Unknown"));
    } finally {
      setAiLoading(false);
    }
  }

  function renderAIResult(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.match(/^#{1,3}\s/)) {
        const clean = line.replace(/^#+\s*/, "").replace(/\*\*/g, "");
        return <h4 key={i} className="text-[14px] font-bold text-[#00e5ff] mt-5 mb-2 pb-1 border-b border-[#1e293b]">{clean}</h4>;
      }
      if (line.match(/^\*\*[^*]+\*\*/)) {
        return <h4 key={i} className="text-[13px] font-bold text-[#e0e4ec] mt-4 mb-1">{line.replace(/\*\*/g, "")}</h4>;
      }
      if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\.\s(.*)/)!;
        return <div key={i} className="flex gap-2 mb-2 ml-1"><span className="text-[#00e5ff] font-mono font-bold shrink-0">{num[1]}.</span><span className="text-[13px] text-[#cbd5e1]">{num[2]}</span></div>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={i} className="text-[13px] text-[#cbd5e1] ml-4 mb-1.5 list-disc">{line.slice(2)}</li>;
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-[13px] text-[#cbd5e1] mb-1 leading-relaxed">{line}</p>;
    });
  }

  const aiCards = [
    {
      title: "Full Synthesis",
      desc: "Trends into positions & timing",
      gradient: "from-[#00e5ff] to-[#0ea5e9]",
      glow: "rgba(0,229,255,0.15)",
      borderHover: "#00e5ff",
      onClick: () =>
        runAI(
          "Full Synthesis",
          "Synthesize mega-trends into positions. Use markdown ## headers for each section. Use bullet points. Be concise and specific with tickers.",
          `Trends:\n${trends.map((t) => `${t.name} [${STAGES[t.stage]}] ${t.confidence}%\nThesis: ${t.thesis}\nInvestments: ${t.investmentMap || "N/A"}`).join("\n\n")}\n\nReturn these sections:\n## Top 5 Asymmetric Plays\n## Asset Class Positioning\n## Physical vs Equity Split\n## Hedges by Scenario\n## Timing & Entry Points\n## Key Risks`,
          "synthesis"
        ),
    },
    {
      title: "Discover Trends",
      desc: "Emerging trends not on radar",
      gradient: "from-[#c084fc] to-[#7c3aed]",
      glow: "rgba(192,132,252,0.15)",
      borderHover: "#c084fc",
      onClick: () =>
        runAI(
          "Discover Trends",
          "Suggest 5 NEW mega-trends. Use markdown ## for each trend name. Under each, bullet points for: thesis, key tickers, why mispriced. Be concise.",
          "Current trends: " + trends.map((t) => t.name).join(", "),
          "scan"
        ),
    },
    {
      title: "Challenge Framework",
      desc: "Find flaws and blind spots",
      gradient: "from-[#ff6b6b] to-[#ff1744]",
      glow: "rgba(255,23,68,0.15)",
      borderHover: "#ff1744",
      onClick: () =>
        runAI(
          "Challenge Framework",
          "Contrarian analyst. Challenge aggressively. Use markdown ## headers for each section. Bullet points. Be specific with tickers and numbers.",
          `${trends.map((t) => `${t.name} [${STAGES[t.stage]}] ${t.confidence}%\nThesis: ${t.thesis}\nBear: ${t.bearCase || "N/A"}`).join("\n\n")}\n\nReturn these sections:\n## Trends Most Likely Wrong\n## Blind Spots & Missing Trends\n## Internal Contradictions\n## Biggest Single Risk\n## Bet Against (specific tickers to short)`,
          "synthesis"
        ),
    },
  ];

  // Load persisted data from localStorage (survives deploys), fallback to server
  useEffect(() => {
    const lsTrends = loadLS<Trend[] | null>(LS_TRENDS, null);
    const lsScans = loadLS<Record<string, { result: string; ts: string; model?: string }> | null>(LS_SCANS, null);
    if (lsTrends && lsTrends.length) setTrendsRaw(lsTrends);
    if (lsScans) setScansRaw(lsScans);
    setReady(true);
  }, []);

  // Load cached prices from localStorage (manual refresh only)
  const [pricesDate, setPricesDate] = useState("");
  const [pricesRefreshing, setPricesRefreshing] = useState(false);

  useEffect(() => {
    // Merge cached live prices on top of hardcoded defaults
    const cached = loadLS<Record<string, PriceData> | null>(LS_PRICES, null);
    if (cached && Object.keys(cached).length) setPrices({ ...DEFAULT_PRICES, ...cached });
    const cachedPerf = loadLS<Record<string, { ticker: string; perf20d: number | null; perf60d: number | null }> | null>(LS_PERF, null);
    if (cachedPerf && Object.keys(cachedPerf).length) setPerformance({ ...DEFAULT_PERFORMANCE, ...cachedPerf });
    try { setPricesDate(localStorage.getItem(LS_PRICES + "_date") || ""); } catch {}
  }, []);

  async function refreshPrices() {
    setPricesRefreshing(true);
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
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0d1117] to-[#111827] border-b border-[#1e293b] px-7 pt-5 pb-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_100%_at_20%_0%,rgba(0,229,255,0.06),transparent_70%)]" />
        <div className="flex justify-between items-start relative">
          <div>
            <h1 className="font-mono text-[22px] font-bold tracking-wider text-[#00e5ff]">TREND COMPASS</h1>
            <p className="text-xs text-[#64748b] tracking-[0.15em] uppercase mt-0.5">Strategic Intelligence System</p>
          </div>
          <button
            onClick={refreshPrices}
            disabled={pricesRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#1e293b] bg-white/[0.04] text-[12px] font-mono text-[#94a3b8] hover:text-[#e0e4ec] hover:border-[#00e5ff44] transition-colors disabled:opacity-50 mt-1"
          >
            <span className={pricesRefreshing ? "animate-spin" : ""}>&#x21bb;</span>
            {pricesRefreshing ? "Refreshing..." : pricesDate ? `Prices: ${pricesDate}` : "Fetch Prices"}
          </button>
        </div>
      </div>

      {/* AI Quick Actions - visible on all tabs */}
      <div className="bg-[#0d1117] border-b border-[#1e293b] px-7 py-4">
        <div className="max-w-[1400px] mx-auto flex gap-3 items-stretch">
          {aiCards.map((c, i) => (
            <button
              key={i}
              disabled={aiLoading}
              onClick={c.onClick}
              className="group relative flex-1 rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{ boxShadow: `0 0 20px ${c.glow}` }}
            >
              {/* Gradient top border */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${c.gradient}`} />
              {/* Card body */}
              <div className="bg-[#111827] px-5 py-3.5 h-full flex items-center gap-3 border border-[#1e293b] border-t-0 rounded-xl group-hover:bg-[#151d2e] transition-colors">
                {/* Accent dot */}
                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${c.gradient} shrink-0 group-hover:scale-125 transition-transform`} />
                <div className="text-left">
                  <span className="text-[13px] font-bold block leading-tight tracking-wide">{c.title}</span>
                  <span className="text-[11px] text-[#64748b] leading-tight group-hover:text-[#94a3b8] transition-colors">{c.desc}</span>
                </div>
                {/* Arrow */}
                <span className="ml-auto text-[#1e293b] group-hover:text-[#475569] transition-colors text-lg">&#x203A;</span>
              </div>
            </button>
          ))}
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
                : "text-[#64748b] border-b-2 border-transparent hover:text-[#94a3b8]"
            }`}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="px-7 py-6 max-w-[1400px] mx-auto">
        {/* AI Modal */}
        {(aiLoading || aiResult) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0c10]/80 backdrop-blur-sm" onClick={() => !aiLoading && setAiResult("")}>
            <div className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[#111827] border-b border-[#1e293b] px-6 py-4 flex justify-between items-center z-10">
                <div>
                  <h3 className="text-[15px] font-bold text-[#00e5ff]">{aiModalTitle}</h3>
                  {aiModel && <span className="text-[11px] text-[#475569] font-mono">via {aiModel}</span>}
                </div>
                {!aiLoading && (
                  <button onClick={() => setAiResult("")} className="text-[#64748b] hover:text-[#e0e4ec] text-lg px-2">X</button>
                )}
              </div>
              <div className="px-6 py-5">
                {aiLoading ? (
                  <div className="py-12 text-center">
                    <div className="inline-block w-5 h-5 border-2 border-[#1e293b] border-t-[#00e5ff] rounded-full animate-spin" />
                    <p className="mt-3 text-[13px] text-[#0ea5e9]">Analyzing...</p>
                  </div>
                ) : (
                  renderAIResult(aiResult)
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "landscape" && <LandscapeTab trends={trends} onSwitchTab={(t, trendId) => { setTab(t); if (trendId) setFocusTrendId(trendId); }} performance={performance} />}
        {tab === "analysis" && <AnalysisTab trends={trends} setTrends={setTrends} scans={scans} setScans={setScans} focusTrendId={focusTrendId} onFocusHandled={() => setFocusTrendId(null)} />}
        {tab === "positions" && <PositionsTab trends={trends} prices={prices} tickerPerf={Object.fromEntries(Object.values(performance).map((p) => [p.ticker, { perf20d: p.perf20d, perf60d: p.perf60d }]))} />}
        {tab === "lab" && <StrategyLabTab trends={trends} />}
      </div>
    </div>
  );
}
