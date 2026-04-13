"use client";

import { useState, useEffect } from "react";
import type { Trend, PriceData } from "@/lib/types";
import { SEED_TRENDS } from "@/lib/seed-data";
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
        {tab === "landscape" && <LandscapeTab trends={trends} onSwitchTab={setTab} />}
        {tab === "analysis" && <AnalysisTab trends={trends} setTrends={setTrends} scans={scans} setScans={setScans} />}
        {tab === "positions" && <PositionsTab trends={trends} prices={prices} />}
        {tab === "lab" && <StrategyLabTab trends={trends} />}
      </div>
    </div>
  );
}
