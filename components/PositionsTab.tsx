"use client";

import { useState } from "react";
import type { Trend, PriceData } from "@/lib/types";
import { POSITIONS, CRASH_WATCHLIST, CATALYSTS, TRADE_LEGS, KEY_CONCEPTS, TIER_INFO } from "@/lib/seed-data";
import { Badge } from "./StagePipeline";

export default function PositionsTab({
  trends,
  prices,
}: {
  trends: Trend[];
  prices: Record<string, PriceData>;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [resultModel, setResultModel] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ t1: true });

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const statusColor = (s: string) =>
    s === "GO" ? "#00e676" : s === "APPROACHING" ? "#ffea00" : "#94a3b8";
  const statusIcon = (s: string) =>
    s === "GO" ? "\u2705" : s === "APPROACHING" ? "\uD83D\uDFE1" : "\u23F3";

  function getVix() {
    return prices["VIX"]?.close ?? null;
  }

  function safePrice(ticker: string): PriceData | null {
    const p = prices[ticker];
    return p && typeof p.close === "number" && !isNaN(p.close) ? p : null;
  }

  function dynamicStatus(p: typeof POSITIONS[0]) {
    const vix = getVix();
    if (p.when === "Buy now" || p.when.startsWith("Buy now")) return "GO";
    if (p.when.startsWith("Open now")) return "GO";
    if (p.when.includes("VIX > 30") && vix !== null && vix > 30) return "GO";
    if (p.when.includes("VIX > 35") && vix !== null && vix > 35) return "GO";
    return p.status;
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-1.5">
        <h2 className="text-xl font-semibold">Positions & Watchlist</h2>
        <button
          className="px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono disabled:opacity-50"
          disabled={loading}
          onClick={async () => {
            setLoading(true); setResult("");
            try {
              const res = await fetch("/api/ai", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  system: "Analyze positions for gaps, concentration, correlation. Suggest specific tickers to add or remove.",
                  prompt: `Positions:\n${POSITIONS.map((p) => `${p.dir} ${p.ticker} Conv:${p.conv}`).join("\n")}\nCrash Watchlist: ${CRASH_WATCHLIST.map((w) => w.ticker).join(", ")}\nTrends: ${trends.map((t) => t.name).join(", ")}\n\n1. Zero coverage gaps?\n2. Concentration risks?\n3. Tickers to add?\n4. Tickers to remove?\n5. Allocation %?`,
                  tier: "synthesis",
                }),
              });
              const data = await res.json();
              setResult(data.error ? "Error: " + data.error : data.result);
              setResultModel(data.model || "");
            } catch (e: unknown) { setResult("Error: " + (e instanceof Error ? e.message : "Unknown")); } finally { setLoading(false); }
          }}
        >
          Analyze Gaps
        </button>
      </div>
      <p className="text-[13px] text-[#64748b] mb-5">
        {POSITIONS.filter((p) => p.dir === "LONG").length} longs &middot; {POSITIONS.filter((p) => p.dir === "SHORT").length} shorts &middot; {POSITIONS.filter((p) => p.dir === "HEDGE").length} hedges &middot; {CRASH_WATCHLIST.length} on crash watchlist
      </p>

      {[1, 2, 3, 4].map((tier) => {
        const items = POSITIONS.filter((p) => p.tier === tier);
        if (!items.length) return null;
        const info = TIER_INFO[tier];
        const key = "t" + tier;
        const isOpen = expanded[key];
        return (
          <div key={tier} className="mb-3">
            <div onClick={() => toggle(key)} className="flex justify-between items-center cursor-pointer px-3.5 py-2.5 bg-white/[0.02] rounded-lg border border-[#1e293b]">
              <div className="flex items-center gap-2.5">
                <span className="text-sm" style={{ color: info.color }}>{isOpen ? "\u25BE" : "\u25B8"}</span>
                <h3 className="text-sm font-semibold" style={{ color: info.color }}>{info.label}</h3>
                <Badge color="#475569">{items.length}</Badge>
              </div>
              <span className="text-[11px] text-[#64748b]">{info.sub}</span>
            </div>
            {isOpen && (
              <div className={`mt-2 ${tier === 1 ? "flex flex-col gap-2" : "grid grid-cols-2 gap-2"}`}>
                {items.map((p, i) => {
                  const dc = p.dir === "LONG" ? "#00e676" : p.dir === "SHORT" ? "#ff1744" : "#c084fc";
                  const ds = dynamicStatus(p);
                  const livePrice = safePrice(p.ticker);
                  return (
                    <div key={i} className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] p-3.5" style={{ borderLeft: `3px solid ${dc}` }}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-bold font-mono" style={{ color: dc }}>{p.ticker}</span>
                          <Badge color={dc}>{p.dir}</Badge>
                          <span className="text-[11px] text-[#475569]">{p.type}{p.fee !== "-" ? ` \u00B7 ${p.fee}` : ""}</span>
                          {livePrice && <span className="text-[11px] text-[#00e5ff] font-mono font-semibold ml-1">${livePrice.close.toFixed(2)}</span>}
                        </div>
                        <span className="text-lg font-bold font-mono" style={{ color: dc }}>{p.conv}</span>
                      </div>
                      <p className="text-[13px] font-semibold mb-1">{p.name}</p>
                      <p className="text-xs text-[#94a3b8] leading-snug mb-1.5">{p.why}</p>
                      <div className="flex gap-3 flex-wrap text-[11px]">
                        <span><span className="text-[#64748b]">When: </span><span className="text-[#00e5ff]">{p.when}</span></span>
                        <span><span className="text-[#64748b]">Corr: </span><span style={{ color: p.corr === "Anti-correlated" ? "#00e676" : p.corr === "Uncorrelated" ? "#c084fc" : "#ffea00" }}>{p.corr}</span></span>
                      </div>
                      <div className="mt-1 px-2 py-[3px] rounded text-[11px] inline-block" style={{ background: statusColor(ds) + "14", color: statusColor(ds) }}>
                        {statusIcon(ds)} {ds}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Crash Watchlist */}
      <div className="mb-3 mt-5">
        <div onClick={() => toggle("crash")} className="flex justify-between items-center cursor-pointer px-3.5 py-2.5 bg-[rgba(224,64,251,0.04)] rounded-lg border border-[#4a1d8e]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-[#e040fb]">{expanded.crash ? "\u25BE" : "\u25B8"}</span>
            <h3 className="text-sm font-semibold text-[#e040fb]">Crash Watchlist</h3>
            <Badge color="#e040fb">{CRASH_WATCHLIST.length}</Badge>
          </div>
          <span className="text-[11px] text-[#64748b]">Quality companies to accumulate 40-60% off highs</span>
        </div>
        {expanded.crash && (
          <div className="mt-2">
            <p className="text-[11px] text-[#94a3b8] mb-2.5 leading-relaxed">
              Dotcom lesson: Amazon $107 to $7 to $3,500. The crash kills junk but drags quality hardware/infra companies down too. Hardware &gt; Software. Physical assets &gt; Digital promises.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CRASH_WATCHLIST.map((w, i) => {
                const isSpec = w.quality.startsWith("SPEC");
                const livePrice = safePrice(w.ticker);
                const highNum = parseFloat(w.high.replace(/[^0-9.]/g, ""));
                const offHighLive = livePrice && highNum ? ((livePrice.close / highNum - 1) * 100).toFixed(1) : null;
                return (
                  <div key={i} className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] p-3" style={{ borderLeft: `3px solid ${isSpec ? "#ff9100" : "#e040fb"}` }}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] font-bold font-mono" style={{ color: isSpec ? "#ff9100" : "#e040fb" }}>{w.ticker}</span>
                        <Badge color={isSpec ? "#ff9100" : "#e040fb"}>{w.sector}</Badge>
                      </div>
                      <span className="text-[11px] text-[#475569] font-mono">{w.maxPos}</span>
                    </div>
                    <p className="text-xs font-semibold mb-1">{w.name}</p>
                    <div className="flex gap-2 flex-wrap mb-1.5 text-[11px]">
                      <span className="px-1.5 py-[2px] rounded bg-white/5">
                        <span className="text-[#64748b]">Now: </span>
                        <span className="text-[#e0e4ec] font-semibold">{livePrice ? `$${livePrice.close.toFixed(2)}` : w.now}</span>
                      </span>
                      <span className="px-1.5 py-[2px] rounded bg-white/5">
                        <span className="text-[#64748b]">High: </span><span className="text-[#94a3b8]">{w.high}</span>
                      </span>
                      <span className="px-1.5 py-[2px] rounded" style={{ background: (offHighLive ? parseFloat(offHighLive) : parseInt(w.offHigh)) < -30 ? "rgba(0,230,118,0.1)" : "rgba(255,234,0,0.08)" }}>
                        <span className="text-[#64748b]">Off high: </span>
                        <span className="font-semibold" style={{ color: (offHighLive ? parseFloat(offHighLive) : parseInt(w.offHigh)) < -30 ? "#00e676" : "#ffea00" }}>
                          {offHighLive ? `${offHighLive}%` : w.offHigh}
                        </span>
                      </span>
                    </div>
                    <div className="px-2 py-1 bg-[rgba(224,64,251,0.06)] rounded mb-1">
                      <span className="text-[11px] text-[#64748b]">Buy zone: </span>
                      <span className="text-[11px] text-[#e040fb] font-semibold">{w.buyPrice}</span>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] leading-snug mt-0.5">{w.quality}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Catalysts */}
      <div className="mb-3">
        <div onClick={() => toggle("catalysts")} className="flex justify-between items-center cursor-pointer px-3.5 py-2.5 bg-white/[0.02] rounded-lg border border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-[#ff9100]">{expanded.catalysts ? "\u25BE" : "\u25B8"}</span>
            <h3 className="text-sm font-semibold text-[#ff9100]">Deployment Catalysts</h3>
            <Badge color="#ff9100">{CATALYSTS.length}</Badge>
          </div>
          <span className="text-[11px] text-[#64748b]">Events that trigger wave transitions</span>
        </div>
        {expanded.catalysts && (
          <div className="mt-2">
            {CATALYSTS.map((c, i) => (
              <div key={i} className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] px-3.5 py-2.5 flex gap-3 mb-1.5">
                <Badge color="#ff9100">{c.date}</Badge>
                <div><span className="text-[13px] font-semibold">{c.name}</span><span className="text-xs text-[#94a3b8]"> &mdash; {c.impact}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Core Trade */}
      <div className="mb-3">
        <div onClick={() => toggle("core")} className="flex justify-between items-center cursor-pointer px-3.5 py-2.5 bg-white/[0.02] rounded-lg border border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-[#00e676]">{expanded.core ? "\u25BE" : "\u25B8"}</span>
            <h3 className="text-sm font-semibold text-[#00e676]">Core Trade Structure</h3>
          </div>
          <span className="text-[11px] text-[#64748b]">Long Hard Assets vs. Short Bonds</span>
        </div>
        {expanded.core && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {TRADE_LEGS.map((l, i) => {
              const lc = l.side === "LONG" ? "#00e676" : "#ff1744";
              return (
                <div key={i} className="px-2.5 py-2.5 rounded-md" style={{ background: l.side === "LONG" ? "rgba(0,230,118,0.05)" : "rgba(255,23,68,0.05)", borderLeft: `3px solid ${lc}` }}>
                  <div className="flex justify-between mb-1"><Badge color={lc}>{l.side}</Badge><span className="text-[11px] text-[#64748b] font-mono">{l.alloc}</span></div>
                  <p className="text-xs text-[#cbd5e1] mb-0.5">{l.inst}</p>
                  <p className="text-[10px] text-[#64748b] italic">{l.note}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Key Frameworks */}
      <div className="mb-3">
        <div onClick={() => toggle("frameworks")} className="flex justify-between items-center cursor-pointer px-3.5 py-2.5 bg-white/[0.02] rounded-lg border border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-[#64748b]">{expanded.frameworks ? "\u25BE" : "\u25B8"}</span>
            <h3 className="text-sm font-semibold text-[#94a3b8]">Key Frameworks</h3>
            <Badge color="#475569">{KEY_CONCEPTS.length}</Badge>
          </div>
        </div>
        {expanded.frameworks && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {KEY_CONCEPTS.map((k, i) => (
              <div key={i} className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] px-3 py-2.5">
                <h4 className="text-xs font-semibold mb-1">{k.name}</h4>
                <p className="text-[11px] text-[#94a3b8] leading-snug">{k.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-gradient-to-br from-[#0c1a2e] to-[#0f1623] border border-[#0e4b7a] rounded-[10px] p-10 text-center animate-pulse mt-4">
          <div className="inline-block w-4 h-4 border-2 border-[#1e293b] border-t-[#00e5ff] rounded-full animate-spin" />
          <p className="mt-3 text-[13px] text-[#0ea5e9]">Analyzing...</p>
        </div>
      )}
      {result && !loading && (
        <div className="bg-gradient-to-br from-[#0c1a2e] to-[#0f1623] border border-[#0e4b7a] rounded-[10px] p-5 mt-4 animate-fadeIn">
          <span className="text-[11px] text-[#00e676] font-mono font-semibold">ANALYSIS{resultModel ? ` via ${resultModel}` : ""}</span>
          <div className="mt-3 text-[13px] text-[#cbd5e1] leading-[1.7] whitespace-pre-wrap">{result}</div>
        </div>
      )}
    </div>
  );
}
