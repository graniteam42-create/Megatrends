"use client";

import { useState } from "react";
import type { Trend, PriceData } from "@/lib/types";
import { POSITIONS, CRASH_WATCHLIST, CATALYSTS, TRADE_LEGS, TIER_INFO } from "@/lib/seed-data";
import { Badge } from "./StagePipeline";

/* ── helpers ─────────────────────────────────────────────────────────── */

function perfText(v: number | null | undefined) {
  if (v === null || v === undefined) return "";
  return (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
}
function perfColor(v: number | null | undefined) {
  if (v === null || v === undefined) return "#475569";
  return v >= 0 ? "#00e676" : "#ff1744";
}

const DIR_COLOR: Record<string, string> = {
  LONG: "#00e676",
  SHORT: "#ff1744",
  HEDGE: "#c084fc",
};
const STATUS_BG: Record<string, string> = {
  GO: "rgba(0,230,118,0.12)",
  APPROACHING: "rgba(255,234,0,0.10)",
  WAIT: "rgba(148,163,184,0.10)",
};
const STATUS_FG: Record<string, string> = {
  GO: "#00e676",
  APPROACHING: "#ffea00",
  WAIT: "#94a3b8",
};

type SortKey =
  | "ticker"
  | "name"
  | "dir"
  | "tier"
  | "type"
  | "price"
  | "perf20d"
  | "perf60d"
  | "conv"
  | "status"
  | "when";

/* ── component ───────────────────────────────────────────────────────── */

export default function PositionsTab({
  trends,
  prices,
  tickerPerf,
}: {
  trends: Trend[];
  prices: Record<string, PriceData>;
  tickerPerf?: Record<string, { perf20d: number | null; perf60d: number | null }>;
}) {
  const [sortCol, setSortCol] = useState<SortKey>("tier");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  /* ── price / status helpers ──────────────────────────────────────── */

  function getVix() {
    return prices["VIX"]?.close ?? null;
  }

  function safePrice(ticker: string): PriceData | null {
    const p = prices[ticker];
    return p && typeof p.close === "number" && !isNaN(p.close) ? p : null;
  }

  function dynamicStatus(p: (typeof POSITIONS)[0]) {
    const vix = getVix();
    if (p.when === "Buy now" || p.when.startsWith("Buy now")) return "GO";
    if (p.when.startsWith("Open now")) return "GO";
    if (p.when.includes("VIX > 30") && vix !== null && vix > 30) return "GO";
    if (p.when.includes("VIX > 35") && vix !== null && vix > 35) return "GO";
    return p.status;
  }

  /* ── sorting ─────────────────────────────────────────────────────── */

  function toggleSort(col: SortKey) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir(col === "conv" ? "desc" : "asc");
    }
  }

  function arrow(col: SortKey) {
    if (sortCol !== col) return "";
    return sortDir === "asc" ? " \u25B2" : " \u25BC";
  }

  const dirOrder: Record<string, number> = { LONG: 0, SHORT: 1, HEDGE: 2 };
  const statusOrder: Record<string, number> = { GO: 0, APPROACHING: 1, WAIT: 2 };

  const sorted = [...POSITIONS].sort((a, b) => {
    let va: number | string;
    let vb: number | string;

    switch (sortCol) {
      case "ticker":
        va = a.ticker;
        vb = b.ticker;
        break;
      case "name":
        va = a.name;
        vb = b.name;
        break;
      case "dir":
        va = dirOrder[a.dir] ?? 9;
        vb = dirOrder[b.dir] ?? 9;
        break;
      case "tier":
        // secondary sort: conviction desc
        if (a.tier !== b.tier) {
          va = a.tier;
          vb = b.tier;
        } else {
          // when tiers match, always sort conv desc regardless of outer direction
          return b.conv - a.conv;
        }
        break;
      case "type":
        va = a.type;
        vb = b.type;
        break;
      case "price":
        va = safePrice(a.ticker)?.close ?? -9999;
        vb = safePrice(b.ticker)?.close ?? -9999;
        break;
      case "perf20d":
        va = tickerPerf?.[a.ticker]?.perf20d ?? -9999;
        vb = tickerPerf?.[b.ticker]?.perf20d ?? -9999;
        break;
      case "perf60d":
        va = tickerPerf?.[a.ticker]?.perf60d ?? -9999;
        vb = tickerPerf?.[b.ticker]?.perf60d ?? -9999;
        break;
      case "conv":
        va = a.conv;
        vb = b.conv;
        break;
      case "status":
        va = statusOrder[dynamicStatus(a)] ?? 9;
        vb = statusOrder[dynamicStatus(b)] ?? 9;
        break;
      case "when":
        va = a.when;
        vb = b.when;
        break;
      default:
        va = 0;
        vb = 0;
    }

    const cmp =
      typeof va === "string"
        ? va.localeCompare(vb as string)
        : (va as number) - (vb as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  /* ── counts ──────────────────────────────────────────────────────── */

  const longCount = POSITIONS.filter((p) => p.dir === "LONG").length;
  const shortCount = POSITIONS.filter((p) => p.dir === "SHORT").length;
  const hedgeCount = POSITIONS.filter((p) => p.dir === "HEDGE").length;

  /* ── column definitions ──────────────────────────────────────────── */

  const cols: { key: SortKey; label: string; tip?: string }[] = [
    { key: "ticker", label: "Ticker" },
    { key: "name", label: "Name" },
    { key: "dir", label: "Dir", tip: "Direction: LONG / SHORT / HEDGE" },
    { key: "tier", label: "Tier", tip: "1 = Deploy now. 2 = On correction. 3 = Individual picks. 4 = Long horizon & hedges." },
    { key: "type", label: "Type" },
    { key: "price", label: "Price", tip: "Live price from market data" },
    { key: "perf20d", label: "20D %", tip: "Price change over the last 20 trading days" },
    { key: "perf60d", label: "60D %", tip: "Price change over the last 60 trading days" },
    { key: "conv", label: "Conviction", tip: "Conviction score 0-100" },
    { key: "status", label: "Status", tip: "GO = deploy now. APPROACHING = nearly triggered. WAIT = conditions not met." },
    { key: "when", label: "When", tip: "Deployment trigger / timing" },
  ];

  /* ── render ──────────────────────────────────────────────────────── */

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-semibold mb-1">Positions & Watchlist</h2>

      {/* ====== SECTION 1: Active Positions ====== */}
      <p className="text-[13px] text-[#94a3b8] mb-4 leading-relaxed max-w-[900px]">
        Active and watchlisted positions across 4 deployment tiers. Tier 1 deploys now (physical commodities, anti-correlated). Tier 2 deploys on correction. Tier 3 is individual high-conviction picks. Tier 4 is long-horizon and hedges.
      </p>

      <p className="text-[13px] text-[#64748b] mb-3">
        {longCount} longs &middot; {shortCount} shorts &middot; {hedgeCount} hedges
      </p>

      <div className="overflow-x-auto rounded-[10px] border border-[#1e293b] mb-10">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-white/[0.03] sticky top-0">
              {cols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#64748b] font-medium select-none whitespace-nowrap cursor-pointer"
                  title={c.tip || ""}
                >
                  {c.label}
                  {arrow(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const ds = dynamicStatus(p);
              const livePrice = safePrice(p.ticker);
              const perf = tickerPerf?.[p.ticker];
              const tierInfo = TIER_INFO[p.tier];

              return (
                <tr
                  key={i}
                  className="hover:bg-white/[0.03] border-b border-[#1e293b]"
                >
                  {/* Ticker */}
                  <td className="px-3 py-2.5 font-mono font-bold" style={{ color: "#00e5ff" }}>
                    {p.ticker}
                  </td>

                  {/* Name */}
                  <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{p.name}</td>

                  {/* Dir */}
                  <td className="px-3 py-2.5">
                    <Badge color={DIR_COLOR[p.dir]}>{p.dir}</Badge>
                  </td>

                  {/* Tier */}
                  <td className="px-3 py-2.5">
                    <span
                      className="font-mono font-bold"
                      style={{ color: tierInfo?.color || "#94a3b8" }}
                      title={tierInfo?.label || ""}
                    >
                      {p.tier}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-2.5 text-[#94a3b8] whitespace-nowrap">{p.type}</td>

                  {/* Price */}
                  <td className="px-3 py-2.5 font-mono" style={{ color: "#e0e4ec" }}>
                    {livePrice ? `$${livePrice.close.toFixed(2)}` : "\u2014"}
                  </td>

                  {/* 20D % */}
                  <td
                    className="px-3 py-2.5 font-mono"
                    style={{ color: perfColor(perf?.perf20d) }}
                  >
                    {perfText(perf?.perf20d)}
                  </td>

                  {/* 60D % */}
                  <td
                    className="px-3 py-2.5 font-mono"
                    style={{ color: perfColor(perf?.perf60d) }}
                  >
                    {perfText(perf?.perf60d)}
                  </td>

                  {/* Conviction */}
                  <td className="px-3 py-2.5 font-mono font-bold" style={{ color: p.conv >= 80 ? "#00e676" : p.conv >= 60 ? "#ffea00" : "#ff9100" }}>
                    {p.conv}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-block px-2.5 py-[3px] rounded-full text-[11px] font-semibold font-mono"
                      style={{
                        background: STATUS_BG[ds] || STATUS_BG.WAIT,
                        color: STATUS_FG[ds] || STATUS_FG.WAIT,
                      }}
                    >
                      {ds}
                    </span>
                  </td>

                  {/* When */}
                  <td className="px-3 py-2.5 text-[#94a3b8] whitespace-nowrap text-[12px]">
                    {p.when}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ====== SECTION 2: Crash Watchlist ====== */}
      <h3 className="text-base font-semibold mb-1">Crash Watchlist</h3>
      <p className="text-[13px] text-[#94a3b8] mb-4 leading-relaxed max-w-[900px]">
        Quality companies to accumulate at 40-60% off highs. The dotcom lesson: Amazon went from $107 to $7 to $3,500. Crashes kill junk but drag quality hardware/infra down too.
      </p>

      <div className="overflow-x-auto rounded-[10px] border border-[#1e293b] mb-10">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-white/[0.03] sticky top-0">
              {(
                [
                  "Ticker",
                  "Name",
                  "Sector",
                  "Price",
                  "High",
                  "Off High",
                  "Buy Zone",
                  "Max Position",
                ] as const
              ).map((label) => (
                <th
                  key={label}
                  className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#64748b] font-medium select-none whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CRASH_WATCHLIST.map((w, i) => {
              const livePrice = safePrice(w.ticker);
              const highNum = parseFloat(w.high.replace(/[^0-9.]/g, ""));
              const offHighLive =
                livePrice && highNum
                  ? (livePrice.close / highNum - 1) * 100
                  : null;
              const offHighVal =
                offHighLive !== null ? offHighLive : parseFloat(w.offHigh);
              const offHighStr =
                offHighLive !== null
                  ? `${offHighLive >= 0 ? "+" : ""}${offHighLive.toFixed(1)}%`
                  : w.offHigh;
              const isDeep = offHighVal < -30;

              return (
                <tr
                  key={i}
                  className="hover:bg-white/[0.03] border-b border-[#1e293b]"
                >
                  <td className="px-3 py-2.5 font-mono font-bold" style={{ color: "#e040fb" }}>
                    {w.ticker}
                  </td>
                  <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{w.name}</td>
                  <td className="px-3 py-2.5 text-[#94a3b8] whitespace-nowrap">{w.sector}</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: "#e0e4ec" }}>
                    {livePrice ? `$${livePrice.close.toFixed(2)}` : w.now}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[#94a3b8]">{w.high}</td>
                  <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: isDeep ? "#00e676" : "#ffea00" }}>
                    {offHighStr}
                  </td>
                  <td className="px-3 py-2.5 text-[#e040fb] font-mono text-[12px]">{w.buyPrice}</td>
                  <td className="px-3 py-2.5 text-[#94a3b8] font-mono text-[12px]">{w.maxPos}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ====== SECTION 3: Catalysts & Framework ====== */}
      <h3 className="text-base font-semibold mb-4">Catalysts & Framework</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Deployment Catalysts */}
        <div className="overflow-x-auto rounded-[10px] border border-[#1e293b]">
          <div className="px-3.5 py-2.5 bg-white/[0.03] border-b border-[#1e293b]">
            <h4 className="text-[11px] uppercase tracking-widest font-mono text-[#ff9100] font-medium">
              Deployment Catalysts
            </h4>
          </div>
          <div className="divide-y divide-[#1e293b]">
            {CATALYSTS.map((c, i) => (
              <div key={i} className="px-3.5 py-2.5 flex items-start gap-3 hover:bg-white/[0.03]">
                <Badge color="#ff9100">{c.date}</Badge>
                <div className="min-w-0">
                  <span className="text-[13px] font-semibold">{c.name}</span>
                  <span className="text-[12px] text-[#94a3b8]"> &mdash; {c.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Core Trade */}
        <div className="overflow-x-auto rounded-[10px] border border-[#1e293b]">
          <div className="px-3.5 py-2.5 bg-white/[0.03] border-b border-[#1e293b]">
            <h4 className="text-[11px] uppercase tracking-widest font-mono text-[#00e676] font-medium">
              Core Trade
            </h4>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-3 py-2 text-left uppercase tracking-widest font-mono text-[11px] text-[#64748b] font-medium">
                  Side
                </th>
                <th className="px-3 py-2 text-left uppercase tracking-widest font-mono text-[11px] text-[#64748b] font-medium">
                  Instrument
                </th>
                <th className="px-3 py-2 text-left uppercase tracking-widest font-mono text-[11px] text-[#64748b] font-medium">
                  Allocation
                </th>
              </tr>
            </thead>
            <tbody>
              {TRADE_LEGS.map((l, i) => {
                const lc = l.side === "LONG" ? "#00e676" : "#ff1744";
                return (
                  <tr key={i} className="border-b border-[#1e293b] hover:bg-white/[0.03]">
                    <td className="px-3 py-2.5">
                      <Badge color={lc}>{l.side}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[#cbd5e1]">{l.inst}</td>
                    <td className="px-3 py-2.5 font-mono text-[#94a3b8]">{l.alloc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
