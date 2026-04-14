"use client";

import { useState } from "react";
import type { Trend, PriceData } from "@/lib/types";
import { POSITIONS, CRASH_WATCHLIST, CATALYSTS, TRADE_LEGS, KEY_CONCEPTS, TIER_INFO } from "@/lib/seed-data";
import { Badge } from "./StagePipeline";

const TREND_COLORS: Record<string, string> = {
  t1: "#00e5ff",
  t2: "#ffea00",
  t3: "#00e676",
  t4: "#ff9100",
  t5: "#c084fc",
  t6: "#0ea5e9",
  t7: "#f59e0b",
  t8: "#ec4899",
  t9: "#14b8a6",
  t10: "#64748b",
};

function TrendBadges({ trendIds, trends }: { trendIds: string[]; trends: Trend[] }) {
  if (!trendIds.length) return <span className="text-[#475569]">—</span>;
  return (
    <div className="flex gap-1 flex-wrap">
      {trendIds.map((tid) => {
        const t = trends.find((tr) => tr.id === tid);
        const color = TREND_COLORS[tid] || "#64748b";
        const name = t?.name || tid;
        return (
          <span
            key={tid}
            className="px-1.5 py-[1px] rounded text-[10px] font-mono font-semibold cursor-default"
            style={{ background: color + "18", color }}
            title={name}
          >
            {name.length > 18 ? name.slice(0, 16) + "…" : name}
          </span>
        );
      })}
    </div>
  );
}

function perfText(v: number | null | undefined) {
  if (v === null || v === undefined) return "";
  return (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
}
function perfColor(v: number | null | undefined) {
  if (v === null || v === undefined) return "#475569";
  return v >= 0 ? "#00e676" : "#ff1744";
}

export default function PositionsTab({
  trends,
  prices,
  tickerPerf,
}: {
  trends: Trend[];
  prices: Record<string, PriceData>;
  tickerPerf?: Record<string, { perf20d: number | null; perf60d: number | null }>;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [resultModel, setResultModel] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const statusColor = (s: string) =>
    s === "GO" ? "#00e676" : s === "APPROACHING" ? "#ffea00" : "#94a3b8";

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
      <p className="text-[13px] text-[#94a3b8] mb-5">
        {POSITIONS.filter((p) => p.dir === "LONG").length} longs &middot; {POSITIONS.filter((p) => p.dir === "SHORT").length} shorts &middot; {POSITIONS.filter((p) => p.dir === "HEDGE").length} hedges &middot; {CRASH_WATCHLIST.length} on crash watchlist
      </p>

      {/* Positions Table */}
      <div className="overflow-x-auto rounded-[10px] border border-[#1e293b] mb-5">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-white/[0.03]">
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Ticker</th>
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Name</th>
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Dir</th>
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Tier</th>
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Type</th>
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Price</th>
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">20D %</th>
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">60D %</th>
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Conv</th>
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Status</th>
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">When</th>
              <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Trends</th>
            </tr>
          </thead>
          <tbody>
            {POSITIONS.map((p, i) => {
              const dc = p.dir === "LONG" ? "#00e676" : p.dir === "SHORT" ? "#ff1744" : "#c084fc";
              const ds = dynamicStatus(p);
              const livePrice = safePrice(p.ticker);
              const perf = tickerPerf?.[p.ticker];
              return (
                <tr key={i} className="border-b border-[#1e293b] hover:bg-white/[0.03]" title={p.why}>
                  <td className="px-3 py-2.5 font-mono font-bold" style={{ color: dc }}>{p.ticker}</td>
                  <td className="px-3 py-2.5 text-[#cbd5e1] whitespace-nowrap">{p.name}</td>
                  <td className="px-3 py-2.5"><Badge color={dc}>{p.dir}</Badge></td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: TIER_INFO[p.tier]?.color }}>{p.tier}</td>
                  <td className="px-3 py-2.5 text-[#94a3b8]">{p.type}</td>
                  <td className="px-3 py-2.5 font-mono text-[#00e5ff]">{livePrice ? `$${livePrice.close.toFixed(2)}` : "—"}</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: perfColor(perf?.perf20d) }}>{perf ? perfText(perf.perf20d) : "—"}</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: perfColor(perf?.perf60d) }}>{perf ? perfText(perf.perf60d) : "—"}</td>
                  <td className="px-3 py-2.5 font-mono font-bold" style={{ color: dc }}>{p.conv}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-[2px] rounded text-[11px] font-semibold" style={{ background: statusColor(ds) + "18", color: statusColor(ds) }}>{ds}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[#94a3b8] text-[12px] whitespace-nowrap">{p.when}</td>
                  <td className="px-3 py-2.5"><TrendBadges trendIds={p.trends} trends={trends} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Crash Watchlist Table */}
      <div className="mb-5">
        <div onClick={() => toggle("crash")} className="flex justify-between items-center cursor-pointer px-3.5 py-2.5 bg-[rgba(224,64,251,0.04)] rounded-lg border border-[#4a1d8e]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-[#e040fb]">{expanded.crash ? "\u25BE" : "\u25B8"}</span>
            <h3 className="text-sm font-semibold text-[#e040fb]">Crash Watchlist</h3>
            <Badge color="#e040fb">{CRASH_WATCHLIST.length}</Badge>
          </div>
          <span className="text-[11px] text-[#c084fc]">Quality companies to accumulate 40-60% off highs</span>
        </div>
        {expanded.crash && (
          <div className="mt-2 overflow-x-auto rounded-[10px] border border-[#1e293b]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Ticker</th>
                  <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Name</th>
                  <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Sector</th>
                  <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Now</th>
                  <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">High</th>
                  <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Off High</th>
                  <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Buy Zone</th>
                  <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Max Pos</th>
                  <th className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Trends</th>
                </tr>
              </thead>
              <tbody>
                {CRASH_WATCHLIST.map((w, i) => {
                  const isSpec = w.quality.startsWith("SPEC");
                  const livePrice = safePrice(w.ticker);
                  const highNum = parseFloat(w.high.replace(/[^0-9.]/g, ""));
                  const offHighLive = livePrice && highNum ? ((livePrice.close / highNum - 1) * 100).toFixed(1) : null;
                  const offVal = offHighLive ? parseFloat(offHighLive) : parseInt(w.offHigh);
                  return (
                    <tr key={i} className="border-b border-[#1e293b] hover:bg-white/[0.03]" title={w.quality}>
                      <td className="px-3 py-2.5 font-mono font-bold" style={{ color: isSpec ? "#ff9100" : "#e040fb" }}>{w.ticker}</td>
                      <td className="px-3 py-2.5 text-[#cbd5e1] whitespace-nowrap">{w.name}</td>
                      <td className="px-3 py-2.5"><Badge color={isSpec ? "#ff9100" : "#e040fb"}>{w.sector}</Badge></td>
                      <td className="px-3 py-2.5 font-mono text-[#00e5ff]">{livePrice ? `$${livePrice.close.toFixed(2)}` : w.now}</td>
                      <td className="px-3 py-2.5 font-mono text-[#94a3b8]">{w.high}</td>
                      <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: offVal < -30 ? "#00e676" : "#ffea00" }}>
                        {offHighLive ? `${offHighLive}%` : w.offHigh}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[#e040fb] font-semibold">{w.buyPrice}</td>
                      <td className="px-3 py-2.5 font-mono text-[#94a3b8]">{w.maxPos}</td>
                      <td className="px-3 py-2.5"><TrendBadges trendIds={w.trends} trends={trends} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
          <span className="text-[11px] text-[#ff9100]">Events that trigger wave transitions</span>
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
          <span className="text-[11px] text-[#00e676]">Long Hard Assets vs. Short Bonds</span>
        </div>
        {expanded.core && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {TRADE_LEGS.map((l, i) => {
              const lc = l.side === "LONG" ? "#00e676" : "#ff1744";
              return (
                <div key={i} className="px-2.5 py-2.5 rounded-md" style={{ background: l.side === "LONG" ? "rgba(0,230,118,0.05)" : "rgba(255,23,68,0.05)", borderLeft: `3px solid ${lc}` }}>
                  <div className="flex justify-between mb-1"><Badge color={lc}>{l.side}</Badge><span className="text-[11px] text-[#94a3b8] font-mono">{l.alloc}</span></div>
                  <p className="text-xs text-[#cbd5e1] mb-0.5">{l.inst}</p>
                  <p className="text-[10px] text-[#94a3b8] italic">{l.note}</p>
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
            <span className="text-sm text-[#94a3b8]">{expanded.frameworks ? "\u25BE" : "\u25B8"}</span>
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

      {/* Loading / Result Modal */}
      {(loading || result) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0c10]/80 backdrop-blur-sm" onClick={() => !loading && setResult("")}>
          <div className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#111827] border-b border-[#1e293b] px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h3 className="text-[15px] font-bold text-[#00e5ff]">Gap Analysis</h3>
                {resultModel && <span className="text-[11px] text-[#475569] font-mono">via {resultModel}</span>}
              </div>
              {!loading && (
                <button onClick={() => setResult("")} className="text-[#64748b] hover:text-[#e0e4ec] text-lg px-2">X</button>
              )}
            </div>
            <div className="px-6 py-5">
              {loading ? (
                <div className="py-12 text-center">
                  <div className="inline-block w-5 h-5 border-2 border-[#1e293b] border-t-[#00e5ff] rounded-full animate-spin" />
                  <p className="mt-3 text-[13px] text-[#0ea5e9]">Analyzing...</p>
                </div>
              ) : (
                <div className="text-[13px] text-[#cbd5e1] leading-[1.7] whitespace-pre-wrap">{result}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
