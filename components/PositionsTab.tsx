"use client";

import { useState, useEffect } from "react";
import type { Trend, PriceData } from "@/lib/types";
import { POSITIONS, CRASH_WATCHLIST, CATALYSTS, TRADE_LEGS, KEY_CONCEPTS, TIER_INFO } from "@/lib/seed-data";
import { Badge } from "./StagePipeline";
import { PieChart, AllocationHistory } from "./AllocationCharts";

const TREND_COLORS: Record<string, string> = {
  t1: "#00e5ff", t2: "#ffea00", t3: "#00e676", t4: "#ff9100", t5: "#c084fc",
  t6: "#0ea5e9", t7: "#f59e0b", t8: "#ec4899", t9: "#14b8a6", t10: "#64748b",
};

// Compact 2-3 letter initials for trend badges
function trendInitials(name: string): string {
  const abbrevs: Record<string, string> = {
    "AI & AGI Disruption": "AI",
    "Financial Repression & Fiat Debasement": "FR",
    "Climate Acceleration & Energy Transition": "CE",
    "Geopolitical Fragmentation": "GF",
    "Demographic Inversion": "DI",
    "Trust Crisis & Verification Economy": "TC",
    "Commodities Financialization": "CF",
    "Synthetic Biology": "SB",
    "Strategic Bridge States": "BS",
    "Carbon as Feedstock": "CO",
  };
  if (abbrevs[name]) return abbrevs[name];
  // Fallback: first letter of each word (max 3)
  return name.split(/\s+/).filter((w) => w.length > 2 && w[0] === w[0].toUpperCase()).map((w) => w[0]).slice(0, 3).join("");
}

function TrendInitialBadges({ trendIds, trends }: { trendIds: string[]; trends: Trend[] }) {
  if (!trendIds.length) return <span className="text-[#475569]">—</span>;
  return (
    <div className="flex gap-[3px] flex-wrap">
      {trendIds.map((tid) => {
        const t = trends.find((tr) => tr.id === tid);
        const color = TREND_COLORS[tid] || "#64748b";
        const name = t?.name || tid;
        const initials = trendInitials(name);
        return (
          <span
            key={tid}
            className="inline-flex items-center justify-center w-[22px] h-[18px] rounded text-[9px] font-mono font-bold cursor-default hover:scale-125 hover:z-10 transition-transform relative group"
            style={{ background: color + "22", color }}
          >
            {initials}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-[#111827] border border-[#334155] text-[10px] text-[#e0e4ec] font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
              {name}
            </span>
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

type SortCol = "ticker" | "name" | "dir" | "tier" | "type" | "price" | "perf20d" | "perf60d" | "conv" | "status" | "when";

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
  const [sortCol, setSortCol] = useState<SortCol>("tier");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // AI Allocation state
  const [allocation, setAllocation] = useState<{ allocations: { name: string; pct: number }[]; reasoning?: string; date?: string; model?: string } | null>(null);
  const [allocHistory, setAllocHistory] = useState<{ date: string; allocations: { name: string; pct: number }[]; reasoning?: string; model?: string }[]>([]);
  const [allocLoading, setAllocLoading] = useState(false);
  const [allocError, setAllocError] = useState("");

  // Load cached allocation on mount
  useEffect(() => {
    fetch("/api/allocation")
      .then((r) => r.json())
      .then((data) => {
        if (data.current) setAllocation(data.current);
        if (data.history) setAllocHistory(data.history);
      })
      .catch(() => {});
  }, []);

  // Generate / refresh allocation
  async function generateAllocation(force?: boolean) {
    setAllocLoading(true);
    setAllocError("");
    try {
      const res = await fetch("/api/allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trends, positions: POSITIONS, prices, force }),
      });
      const data = await res.json();
      if (data.error) {
        setAllocError(data.error);
      } else {
        setAllocation(data.current);
        if (data.history) setAllocHistory(data.history);
      }
    } catch (e: unknown) {
      setAllocError(e instanceof Error ? e.message : "Failed to generate allocation");
    } finally {
      setAllocLoading(false);
    }
  }

  // Auto-generate on first load if no allocation exists
  useEffect(() => {
    if (!allocation && !allocLoading && trends.length > 0) {
      const timer = setTimeout(() => generateAllocation(), 500);
      return () => clearTimeout(timer);
    }
  }, [allocation, trends.length]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function parseBuyRange(buyPrice: string): [number, number] | null {
    const match = buyPrice.match(/\$?([\d,.]+)\s*[-–]\s*\$?([\d,.]+)/);
    if (!match) return null;
    const low = parseFloat(match[1].replace(/,/g, ""));
    const high = parseFloat(match[2].replace(/,/g, ""));
    if (isNaN(low) || isNaN(high)) return null;
    return [low, high];
  }

  function getBuyZoneStatus(w: typeof CRASH_WATCHLIST[0]): "in_zone" | "near_zone" | "above" {
    const livePrice = safePrice(w.ticker);
    if (!livePrice) return "above";
    const range = parseBuyRange(w.buyPrice);
    if (!range) return "above";
    const [low, high] = range;
    const price = livePrice.close;
    if (price >= low && price <= high) return "in_zone";
    if (price > high && price <= high * 1.1) return "near_zone";
    return "above";
  }

  // Sorting logic
  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  const STATUS_ORDER: Record<string, number> = { GO: 0, APPROACHING: 1, WAIT: 2 };

  const sorted = [...POSITIONS].sort((a, b) => {
    let va: number | string, vb: number | string;
    const pa = tickerPerf?.[a.ticker];
    const pb = tickerPerf?.[b.ticker];
    switch (sortCol) {
      case "ticker": va = a.ticker; vb = b.ticker; break;
      case "name": va = a.name; vb = b.name; break;
      case "dir": va = a.dir; vb = b.dir; break;
      case "tier": va = a.tier; vb = b.tier; break;
      case "type": va = a.type; vb = b.type; break;
      case "price": va = safePrice(a.ticker)?.close ?? -1; vb = safePrice(b.ticker)?.close ?? -1; break;
      case "perf20d": va = pa?.perf20d ?? -9999; vb = pb?.perf20d ?? -9999; break;
      case "perf60d": va = pa?.perf60d ?? -9999; vb = pb?.perf60d ?? -9999; break;
      case "conv": va = a.conv; vb = b.conv; break;
      case "status": va = STATUS_ORDER[dynamicStatus(a)] ?? 9; vb = STATUS_ORDER[dynamicStatus(b)] ?? 9; break;
      case "when": va = a.when; vb = b.when; break;
      default: va = 0; vb = 0;
    }
    const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  function arrow(col: SortCol) {
    if (sortCol !== col) return "";
    return sortDir === "asc" ? " \u25B2" : " \u25BC";
  }

  const TH = ({ col, label, tip }: { col: SortCol; label: string; tip?: string }) => (
    <th
      onClick={() => toggleSort(col)}
      className="px-2 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium select-none whitespace-nowrap cursor-pointer hover:text-[#cbd5e1]"
      title={tip}
    >
      {label}{arrow(col)}
    </th>
  );

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Positions & Watchlist</h2>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">
            {POSITIONS.filter((p) => p.dir === "LONG").length} longs · {POSITIONS.filter((p) => p.dir === "SHORT").length} shorts · {POSITIONS.filter((p) => p.dir === "HEDGE").length} hedges · {CRASH_WATCHLIST.length} on crash watchlist
          </p>
        </div>
        <button
          className="group relative px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono disabled:opacity-50"
          disabled={loading}
          title="AI analyzes your portfolio for gaps, concentration risks, and missing trend coverage. Uses Claude Sonnet for deep reasoning."
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
          <span className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg bg-[#111827] border border-[#334155] text-[11px] text-[#cbd5e1] font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg max-w-xs text-left normal-case">
            AI finds gaps, concentration risks, and missing trend coverage in your portfolio
          </span>
        </button>
      </div>

      {/* AI Portfolio Allocation */}
      <div className="mb-6 bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#00e5ff]">AI Portfolio Allocation</h3>
            <p className="text-[11px] text-[#475569] font-mono mt-0.5">
              {allocation?.date ? `Generated ${allocation.date}` : "Not yet generated"}
              {allocation?.model ? ` via ${allocation.model}` : ""}
            </p>
          </div>
          <button
            onClick={() => generateAllocation(true)}
            disabled={allocLoading}
            title="Regenerate allocation using AI. Uses Claude Sonnet (~$0.05 per call). Cached daily."
            className="group relative px-3 py-1.5 rounded-md border border-[#1e293b] bg-white/[0.06] text-[#94a3b8] text-[12px] font-semibold font-mono hover:bg-white/[0.1] disabled:opacity-50"
          >
            {allocLoading ? "Generating..." : "Regenerate"}
            <span className="absolute bottom-full right-0 mb-2 px-2 py-1 rounded bg-[#111827] border border-[#334155] text-[10px] text-[#cbd5e1] font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
              AI suggests portfolio allocation based on trends, positions, and prices
            </span>
          </button>
        </div>

        {allocError && (
          <div className="px-3 py-2 rounded-md bg-[rgba(255,23,68,0.08)] border border-[#ff174433] text-[12px] text-[#ff1744] mb-3">
            {allocError}
          </div>
        )}

        {allocLoading && !allocation && (
          <div className="py-10 text-center">
            <div className="inline-block w-5 h-5 border-2 border-[#1e293b] border-t-[#00e5ff] rounded-full animate-spin" />
            <p className="mt-3 text-[13px] text-[#0ea5e9]">Generating allocation...</p>
          </div>
        )}

        {allocation && allocation.allocations.length > 0 && (
          <>
            {/* Pie chart + reasoning side by side */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <PieChart allocations={allocation.allocations} />
              </div>
              {allocation.reasoning && (
                <div className="lg:w-[320px] shrink-0 px-4 py-3.5 bg-[rgba(0,229,255,0.04)] rounded-lg border border-[#1e293b] self-start">
                  <span className="text-[11px] text-[#00e5ff] uppercase tracking-widest font-mono font-semibold block mb-2">AI Commentary</span>
                  <p className="text-[12px] text-[#cbd5e1] leading-[1.7]">{allocation.reasoning}</p>
                </div>
              )}
            </div>

            {/* Regime signals */}
            {(allocation as Record<string, unknown>).regime && (() => {
              const r = (allocation as Record<string, unknown>).regime as { regime: string; overallScore: number; signals: { name: string; value: number | null; interpretation: string; score: number }[]; equityCorrelationCap: number; deployableTiers: number[] };
              const regimeColor = r.regime === "CALM" ? "#00e676" : r.regime === "CAUTIOUS" ? "#ffea00" : r.regime === "STRESSED" ? "#ff9100" : "#ff1744";
              return (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-[#475569] uppercase tracking-widest font-mono">Market Regime</span>
                    <span className="px-2 py-[2px] rounded text-[11px] font-bold font-mono" style={{ background: regimeColor + "18", color: regimeColor }}>
                      {r.regime}
                    </span>
                    <span className="text-[11px] text-[#475569] font-mono">score {r.overallScore.toFixed(2)} | deploy T{r.deployableTiers.join(",T")} | eq. cap {r.equityCorrelationCap}%</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                    {r.signals.map((s, i) => {
                      const sc = s.score;
                      const color = sc >= 1 ? "#00e676" : sc >= 0.3 ? "#a3e635" : sc >= -0.3 ? "#94a3b8" : sc >= -1 ? "#ffea00" : "#ff1744";
                      return (
                        <div key={i} className="px-2 py-1.5 rounded bg-white/[0.02] border border-[#1e293b] cursor-default" title={s.interpretation}>
                          <div className="text-[10px] text-[#475569] font-mono truncate">{s.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[13px] font-mono font-bold" style={{ color }}>{s.value !== null ? (typeof s.value === "number" ? s.value.toFixed(1) : s.value) : "—"}</span>
                            <span className="text-[9px] font-mono" style={{ color }}>{sc > 0 ? "+" : ""}{sc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {allocHistory.length > 1 && (
          <div className="mt-5">
            <h4 className="text-[13px] font-semibold text-[#94a3b8] mb-2">Allocation History</h4>
            <AllocationHistory history={allocHistory} />
          </div>
        )}
      </div>

      {/* Single sortable positions table */}
      <div className="overflow-x-auto rounded-[10px] border border-[#1e293b] mb-5">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-white/[0.03] sticky top-0">
              <TH col="ticker" label="Ticker" />
              <TH col="name" label="Name" />
              <TH col="dir" label="Dir" />
              <TH col="tier" label="Tier" tip="T1: Physical (deploy now), T2: Miners/Sectors (on correction), T3: Individual stocks, T4: Long horizon/hedges" />
              <TH col="type" label="Type" />
              <TH col="price" label="Price" />
              <TH col="perf20d" label="20D %" tip="Price change over last 20 trading days" />
              <TH col="perf60d" label="60D %" tip="Price change over last 60 trading days" />
              <TH col="conv" label="Conv" tip="Convergence score — how many trend intersections support this position" />
              <TH col="status" label="Status" tip="GO = deploy now, APPROACHING = nearing entry, WAIT = conditions not met" />
              <TH col="when" label="When" tip="Entry conditions — what needs to happen before deploying" />
              <th className="px-2 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium whitespace-nowrap">Trends</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const dc = p.dir === "LONG" ? "#00e676" : p.dir === "SHORT" ? "#ff1744" : "#c084fc";
              const ds = dynamicStatus(p);
              const livePrice = safePrice(p.ticker);
              const perf = tickerPerf?.[p.ticker];
              const tierInfo = TIER_INFO[p.tier];
              return (
                <tr key={i} className="border-b border-[#1e293b] hover:bg-white/[0.03]" title={p.why}>
                  <td className="px-2 py-2 font-mono font-bold" style={{ color: dc }}>{p.ticker}</td>
                  <td className="px-2 py-2 text-[#cbd5e1] whitespace-nowrap text-[12px]">{p.name}</td>
                  <td className="px-2 py-2"><Badge color={dc}>{p.dir}</Badge></td>
                  <td className="px-2 py-2">
                    <span className="font-mono text-[11px] font-bold" style={{ color: tierInfo?.color }} title={tierInfo?.label}>T{p.tier}</span>
                  </td>
                  <td className="px-2 py-2 text-[#94a3b8] text-[12px]">{p.type}</td>
                  <td className="px-2 py-2 font-mono text-[#00e5ff]">{livePrice ? `$${livePrice.close.toFixed(2)}` : "—"}</td>
                  <td className="px-2 py-2 font-mono" style={{ color: perfColor(perf?.perf20d) }}>{perf ? perfText(perf.perf20d) : "—"}</td>
                  <td className="px-2 py-2 font-mono" style={{ color: perfColor(perf?.perf60d) }}>{perf ? perfText(perf.perf60d) : "—"}</td>
                  <td className="px-2 py-2 font-mono font-bold" style={{ color: dc }}>{p.conv}</td>
                  <td className="px-2 py-2">
                    <span className="px-2 py-[2px] rounded text-[11px] font-semibold" style={{ background: statusColor(ds) + "18", color: statusColor(ds) }}>{ds}</span>
                  </td>
                  <td className="px-2 py-2 text-[#94a3b8] text-[11px] whitespace-nowrap">{p.when}</td>
                  <td className="px-2 py-2"><TrendInitialBadges trendIds={p.trends} trends={trends} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Crash Watchlist Table */}
      <div className="mb-5">
        {(() => {
          const inZone = CRASH_WATCHLIST.filter((w) => getBuyZoneStatus(w) === "in_zone").length;
          const nearZone = CRASH_WATCHLIST.filter((w) => getBuyZoneStatus(w) === "near_zone").length;
          return (
            <div onClick={() => toggle("crash")} className="flex justify-between items-center cursor-pointer px-3.5 py-2.5 bg-[rgba(224,64,251,0.04)] rounded-lg border border-[#4a1d8e]">
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-[#e040fb]">{expanded.crash ? "\u25BE" : "\u25B8"}</span>
                <h3 className="text-sm font-semibold text-[#e040fb]">Crash Watchlist</h3>
                <Badge color="#e040fb">{CRASH_WATCHLIST.length}</Badge>
                {inZone > 0 && <Badge color="#00e676">{inZone} in buy zone</Badge>}
                {nearZone > 0 && <Badge color="#ffea00">{nearZone} near zone</Badge>}
              </div>
              <span className="text-[11px] text-[#c084fc] hidden sm:inline">Quality companies to accumulate 40-60% off highs</span>
            </div>
          );
        })()}
        {expanded.crash && (
          <div className="mt-2 overflow-x-auto rounded-[10px] border border-[#1e293b]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="px-2 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Ticker</th>
                  <th className="px-2 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Name</th>
                  <th className="px-2 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Sector</th>
                  <th className="px-2 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Now</th>
                  <th className="px-2 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">High</th>
                  <th className="px-2 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Off High</th>
                  <th className="px-2 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Buy Zone</th>
                  <th className="px-2 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Max Pos</th>
                  <th className="px-2 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8] font-medium">Trends</th>
                </tr>
              </thead>
              <tbody>
                {CRASH_WATCHLIST.map((w, i) => {
                  const isSpec = w.quality.startsWith("SPEC");
                  const livePrice = safePrice(w.ticker);
                  const highNum = parseFloat(w.high.replace(/[^0-9.]/g, ""));
                  const offHighLive = livePrice && highNum ? ((livePrice.close / highNum - 1) * 100).toFixed(1) : null;
                  const offVal = offHighLive ? parseFloat(offHighLive) : parseInt(w.offHigh);
                  const zoneStatus = getBuyZoneStatus(w);
                  return (
                    <tr
                      key={i}
                      className="border-b border-[#1e293b] hover:bg-white/[0.03]"
                      title={w.quality}
                      style={zoneStatus === "in_zone" ? { background: "rgba(0,230,118,0.06)" } : zoneStatus === "near_zone" ? { background: "rgba(255,234,0,0.04)" } : undefined}
                    >
                      <td className="px-2 py-2.5 font-mono font-bold" style={{ color: isSpec ? "#ff9100" : "#e040fb" }}>
                        <div className="flex items-center gap-1.5">
                          {w.ticker}
                          {zoneStatus === "in_zone" && <span className="px-1.5 py-[1px] rounded text-[9px] font-bold bg-[#00e67622] text-[#00e676] uppercase tracking-wider">BUY</span>}
                          {zoneStatus === "near_zone" && <span className="px-1.5 py-[1px] rounded text-[9px] font-bold bg-[#ffea0022] text-[#ffea00] uppercase tracking-wider">NEAR</span>}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-[#cbd5e1] whitespace-nowrap">{w.name}</td>
                      <td className="px-2 py-2.5"><Badge color={isSpec ? "#ff9100" : "#e040fb"}>{w.sector}</Badge></td>
                      <td className="px-2 py-2.5 font-mono" style={{ color: zoneStatus === "in_zone" ? "#00e676" : "#00e5ff" }}>
                        {livePrice ? `$${livePrice.close.toFixed(2)}` : w.now}
                      </td>
                      <td className="px-2 py-2.5 font-mono text-[#94a3b8]">{w.high}</td>
                      <td className="px-2 py-2.5 font-mono font-semibold" style={{ color: offVal < -30 ? "#00e676" : "#ffea00" }}>
                        {offHighLive ? `${offHighLive}%` : w.offHigh}
                      </td>
                      <td className="px-2 py-2.5 font-mono text-[#e040fb] font-semibold">{w.buyPrice}</td>
                      <td className="px-2 py-2.5 font-mono text-[#94a3b8]">{w.maxPos}</td>
                      <td className="px-2 py-2.5"><TrendInitialBadges trendIds={w.trends} trends={trends} /></td>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
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
