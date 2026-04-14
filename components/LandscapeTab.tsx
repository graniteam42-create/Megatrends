"use client";

import { useState, useMemo } from "react";
import type { Trend } from "@/lib/types";
import { STAGES, STAGE_COLORS, SCENARIOS, HORIZONS, TREND_IMAGES } from "@/lib/seed-data";
import { Badge } from "./StagePipeline";

function perfColor(v: number | null) {
  if (v === null) return "#475569";
  return v >= 0 ? "#00e676" : "#ff1744";
}
function perfText(v: number | null) {
  if (v === null) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
}
function kpiColor(v: number) {
  return v > 70 ? "#00e676" : v > 50 ? "#ffea00" : "#ff9100";
}

export default function LandscapeTab({
  trends,
  onSwitchTab,
  performance,
}: {
  trends: Trend[];
  onSwitchTab: (tab: string, trendId?: string) => void;
  performance: Record<string, { ticker: string; perf20d: number | null; perf60d: number | null }>;
}) {
  const [sortCol, setSortCol] = useState<string>("mispricing");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  }

  const sorted = useMemo(() => [...trends].sort((a, b) => {
    let va: number | string, vb: number | string;
    switch (sortCol) {
      case "name": va = a.name; vb = b.name; break;
      case "stage": va = a.stage; vb = b.stage; break;
      case "confidence": va = a.confidence; vb = b.confidence; break;
      case "mispricing": va = a.mispricingScore; vb = b.mispricingScore; break;
      case "horizon": va = HORIZONS.indexOf(a.horizon); vb = HORIZONS.indexOf(b.horizon); break;
      case "perf20d": va = performance[a.id]?.perf20d ?? -9999; vb = performance[b.id]?.perf20d ?? -9999; break;
      case "perf60d": va = performance[a.id]?.perf60d ?? -9999; vb = performance[b.id]?.perf60d ?? -9999; break;
      default: va = 0; vb = 0;
    }
    const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return sortDir === "asc" ? cmp : -cmp;
  }), [trends, sortCol, sortDir, performance]);

  const cols: { key: string; label: string; tip?: string }[] = [
    { key: "name", label: "Name" },
    { key: "stage", label: "Stage", tip: "Nascent → Emerging → Accelerating → Consensus → Overcrowded" },
    { key: "confidence", label: "Confidence", tip: "How confident we are the trend plays out (0-100). Based on evidence strength and structural drivers." },
    { key: "mispricing", label: "Mispricing", tip: "How much the market underprices this trend (0-100). Higher = more opportunity to profit." },
    { key: "horizon", label: "Horizon", tip: "Expected timeframe for the trend to materialize and generate returns." },
    { key: "ticker", label: "Ticker", tip: "Main benchmark ticker for tracking this trend's performance." },
    { key: "perf20d", label: "20D %", tip: "Benchmark ticker price change over the last 20 trading days (~1 month)." },
    { key: "perf60d", label: "60D %", tip: "Benchmark ticker price change over the last 60 trading days (~3 months)." },
  ];

  const TICKER_DESCRIPTIONS: Record<string, string> = {
    "NVDA": "NVIDIA — GPU monopoly powering AI infrastructure",
    "WGLD": "WisdomTree Physical Gold — hard asset hedge vs fiat debasement",
    "SPUT": "Sprott Physical Uranium — direct exposure to nuclear fuel demand",
    "RARE": "WisdomTree Strategic Metals — lithium, rare earths, copper miners",
    "IXJ": "iShares Global Healthcare — aging population demand proxy",
    "W1TB": "WisdomTree Cybersecurity — zero-trust & verification economy",
    "GDX": "VanEck Gold Miners — leveraged play on gold price",
    "CCJ": "Cameco — largest western uranium producer",
    "NXE": "NexGen Energy — high-grade uranium development",
    "WNUC": "WisdomTree Uranium & Nuclear — broad nuclear exposure",
  };

  function arrow(col: string) {
    if (sortCol !== col) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-semibold mb-1">Macro Landscape</h2>
      <p className="text-[13px] text-[#64748b] mb-5">{trends.length} active trends</p>

      <div className="overflow-x-auto rounded-[10px] border border-[#1e293b]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-white/[0.03] sticky top-0">
              {cols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => c.key !== "ticker" && toggleSort(c.key)}
                  className="px-3 py-2.5 text-left uppercase tracking-widest font-mono text-[11px] text-[#64748b] font-medium select-none whitespace-nowrap"
                  style={{ cursor: c.key !== "ticker" ? "pointer" : "default" }}
                  title={c.tip || ""}
                >
                  {c.label}{arrow(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const p = performance[t.id];
              return (
                <tr
                  key={t.id}
                  onClick={() => onSwitchTab("analysis", t.id)}
                  className="hover:bg-white/[0.03] cursor-pointer border-b border-[#1e293b]"
                >
                  <td className="px-3 py-2.5 font-semibold">
                    <div className="flex items-center gap-2.5">
                      {TREND_IMAGES[t.id] && (
                        <img src={TREND_IMAGES[t.id].thumb} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                      )}
                      {t.name}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge color={STAGE_COLORS[t.stage]}>{STAGES[t.stage]}</Badge>
                  </td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: kpiColor(t.confidence) }}>
                    {t.confidence}
                  </td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: kpiColor(t.mispricingScore) }}>
                    {t.mispricingScore}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{t.horizon}</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: "#00e5ff" }} title={p?.ticker ? (TICKER_DESCRIPTIONS[p.ticker] || p.ticker) : ""}>
                    {p?.ticker ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: perfColor(p?.perf20d ?? null) }}>
                    {perfText(p?.perf20d ?? null)}
                  </td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: perfColor(p?.perf60d ?? null) }}>
                    {perfText(p?.perf60d ?? null)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="mt-8 text-base font-semibold text-[#ffea00]">Scenario Matrix</h3>
      <p className="text-[13px] text-[#64748b] mt-1 mb-3.5">Probability-weighted futures</p>
      <div className="grid grid-cols-3 gap-3.5">
        {SCENARIOS.map((sc, i) => {
          const c = sc.type === "base" ? "#ffea00" : sc.type === "bear" ? "#ff1744" : "#00e676";
          return (
            <div key={i} className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] p-5" style={{ borderLeft: `3px solid ${c}` }}>
              <div className="flex justify-between mb-2">
                <h4 className="text-sm font-semibold" style={{ color: c }}>{sc.name}</h4>
                <Badge color={c}>{sc.prob}%</Badge>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-2.5">{sc.desc}</p>
              <div className="px-2.5 py-2 bg-white/[0.03] rounded-md text-[11px] text-[#cbd5e1] leading-relaxed font-mono">{sc.portfolio}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
