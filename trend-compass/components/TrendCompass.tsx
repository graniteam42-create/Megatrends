"use client";

import { useState, useEffect } from "react";
import type { Trend, PriceData } from "@/lib/types";
import { SEED_TRENDS, STAGES } from "@/lib/seed-data";
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

export default function TrendCompass() {
  const [tab, setTab] = useState("landscape");
  const [trends, setTrends] = useState<Trend[]>(SEED_TRENDS);
  const [scans, setScans] = useState<Record<string, { result: string; ts: string; model?: string }>>({});
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [ready, setReady] = useState(false);

  // AI state (shared across all tabs)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiModel, setAiModel] = useState("");

  async function runAI(system: string, prompt: string, tier: "scan" | "synthesis") {
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

  const aiCards = [
    {
      icon: "\uD83D\uDCCA",
      title: "Full Synthesis",
      desc: "Trends into positions",
      onClick: () =>
        runAI(
          "Synthesize mega-trends into positions. Specific tickers, timing, sizing.",
          `Trends:\n${trends.map((t) => `${t.name} [${STAGES[t.stage]}] ${t.confidence}%\nThesis: ${t.thesis}\nInvestments: ${t.investmentMap || "N/A"}`).join("\n\n")}\n\n1. Top 5 asymmetric plays (tickers)\n2. Asset class positioning\n3. Physical vs equity\n4. Hedges per scenario\n5. Timing\n6. Risks`,
          "synthesis"
        ),
    },
    {
      icon: "\uD83D\uDD2E",
      title: "Discover Trends",
      desc: "Emerging trends not on radar",
      onClick: () =>
        runAI(
          "Suggest 5 NEW mega-trends with specific tickers and mispricing scores.",
          "Current: " + trends.map((t) => t.name).join(", "),
          "scan"
        ),
    },
    {
      icon: "\uD83C\uDFAF",
      title: "Challenge Framework",
      desc: "Find flaws and blind spots",
      onClick: () =>
        runAI(
          "Contrarian analyst. Challenge aggressively. Be specific.",
          `${trends.map((t) => `${t.name} [${STAGES[t.stage]}] ${t.confidence}%\nThesis: ${t.thesis}\nBear: ${t.bearCase || "N/A"}`).join("\n\n")}\n\n1. Which WRONG?\n2. Missing?\n3. Contradictions?\n4. Biggest risk?\n5. Bet AGAINST which?`,
          "synthesis"
        ),
    },
  ];

  // Load persisted data
  useEffect(() => {
    (async () => {
      try {
        const [tRes, sRes] = await Promise.all([
          fetch("/api/trends"),
          fetch("/api/scans"),
        ]);
        if (tRes.ok) { const data = await tRes.json(); if (Array.isArray(data) && data.length) setTrends(data); }
        if (sRes.ok) { const data = await sRes.json(); if (data && typeof data === "object") setScans(data); }
      } catch {}
      setReady(true);
    })();
  }, []);

  // Persist trends
  useEffect(() => {
    if (!ready) return;
    fetch("/api/trends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trends),
    }).catch(() => {});
  }, [trends, ready]);

  // Persist scans
  useEffect(() => {
    if (!ready) return;
    fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scans),
    }).catch(() => {});
  }, [scans, ready]);

  // Fetch prices
  useEffect(() => {
    const load = () => fetch("/api/prices").then((r) => r.json()).then(setPrices).catch(() => {});
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-sans bg-[#0a0c10] text-[#e0e4ec] min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0d1117] to-[#111827] border-b border-[#1e293b] px-7 pt-5 pb-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_100%_at_20%_0%,rgba(0,229,255,0.06),transparent_70%)]" />
        <h1 className="font-mono text-[22px] font-bold tracking-wider text-[#00e5ff] relative">TREND COMPASS</h1>
        <p className="text-xs text-[#64748b] tracking-[0.15em] uppercase mt-0.5 relative">Strategic Intelligence System</p>
      </div>

      {/* AI Quick Actions - visible on all tabs */}
      <div className="bg-[#0d1117] border-b border-[#1e293b] px-7 py-3">
        <div className="max-w-[1400px] mx-auto flex gap-2.5 items-center">
          <span className="text-[11px] text-[#475569] font-mono uppercase tracking-widest mr-1 shrink-0">AI</span>
          {aiCards.map((c, i) => (
            <button
              key={i}
              disabled={aiLoading}
              onClick={c.onClick}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-lg cursor-pointer hover:border-[#00e5ff44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-base">{c.icon}</span>
              <div className="text-left">
                <span className="text-[12px] font-semibold block leading-tight">{c.title}</span>
                <span className="text-[10px] text-[#64748b] leading-tight">{c.desc}</span>
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
        {/* AI loading/result panel - shown on all tabs when active */}
        {aiLoading && (
          <div className="bg-gradient-to-br from-[#0c1a2e] to-[#0f1623] border border-[#0e4b7a] rounded-[10px] p-8 text-center animate-pulse mb-5">
            <div className="inline-block w-4 h-4 border-2 border-[#1e293b] border-t-[#00e5ff] rounded-full animate-spin" />
            <p className="mt-3 text-[13px] text-[#0ea5e9]">Analyzing...</p>
          </div>
        )}
        {aiResult && !aiLoading && (
          <div className="bg-gradient-to-br from-[#0c1a2e] to-[#0f1623] border border-[#0e4b7a] rounded-[10px] p-5 mb-5 animate-fadeIn">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[#00e676] font-mono font-semibold">ANALYSIS{aiModel ? ` via ${aiModel}` : ""}</span>
              <button onClick={() => setAiResult("")} className="text-[11px] text-[#475569] hover:text-[#94a3b8] font-mono">Dismiss</button>
            </div>
            <div className="mt-3 text-[13px] text-[#cbd5e1] leading-[1.7] whitespace-pre-wrap">{aiResult}</div>
          </div>
        )}

        {tab === "landscape" && <LandscapeTab trends={trends} onSwitchTab={setTab} />}
        {tab === "analysis" && <AnalysisTab trends={trends} setTrends={setTrends} scans={scans} setScans={setScans} />}
        {tab === "positions" && <PositionsTab trends={trends} prices={prices} />}
        {tab === "lab" && <StrategyLabTab trends={trends} />}
      </div>
    </div>
  );
}
