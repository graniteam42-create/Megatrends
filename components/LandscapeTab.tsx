"use client";

import type { Trend } from "@/lib/types";
import { STAGES, STAGE_COLORS, SCENARIOS } from "@/lib/seed-data";
import { StagePipeline, Meter, Badge } from "./StagePipeline";

export default function LandscapeTab({
  trends,
  onSwitchTab,
}: {
  trends: Trend[];
  onSwitchTab: (tab: string) => void;
}) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-semibold mb-1">Macro Landscape</h2>
      <p className="text-[13px] text-[#64748b] mb-5">{trends.length} active trends</p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
        {trends.map((t) => (
          <div
            key={t.id}
            className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] p-4 cursor-pointer hover:border-[#00e5ff33] transition-colors"
            onClick={() => onSwitchTab("analysis")}
          >
            <div className="flex justify-between mb-2">
              <h3 className="text-[13px] font-semibold flex-1 leading-snug">{t.name}</h3>
              <Badge color={STAGE_COLORS[t.stage]}>{STAGES[t.stage]}</Badge>
            </div>
            <StagePipeline stage={t.stage} />
            <div className="mt-2.5"><Meter label="Mispricing" value={t.mispricingScore} /></div>
            <div className="mt-1.5"><Meter label="Confidence" value={t.confidence} /></div>
            <div className="mt-2"><Badge color="#94a3b8">{t.horizon}</Badge></div>
          </div>
        ))}
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
