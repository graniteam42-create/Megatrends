"use client";

import { STAGES, STAGE_COLORS } from "@/lib/seed-data";

export function StagePipeline({ stage, onChange }: { stage: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-[3px] items-center">
      {STAGES.map((x, i) => (
        <div
          key={x}
          onClick={() => onChange?.(i)}
          className={`flex-1 h-2 rounded ${onChange ? "cursor-pointer" : "cursor-default"}`}
          style={{
            background: i <= stage ? STAGE_COLORS[stage] : "#1e293b",
            opacity: i <= stage ? 1 : 0.4,
          }}
          title={x}
        />
      ))}
      <span
        className="text-[11px] ml-2 font-mono font-semibold whitespace-nowrap"
        style={{ color: STAGE_COLORS[stage] }}
      >
        {STAGES[stage]}
      </span>
    </div>
  );
}

export function Meter({ label, value }: { label: string; value: number }) {
  const c = value > 70 ? "#00e676" : value > 50 ? "#ffea00" : "#ff9100";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[#94a3b8] uppercase tracking-widest font-mono whitespace-nowrap">{label}</span>
      <div className="h-1.5 bg-[#1e293b] rounded-sm overflow-hidden flex-1">
        <div className="h-full rounded-sm transition-[width] duration-500" style={{ width: `${value}%`, background: c }} />
      </div>
      <span className="text-[13px] font-bold font-mono min-w-[38px] text-right" style={{ color: c }}>
        {value}{label === "Confidence" ? "%" : ""}
      </span>
    </div>
  );
}

export function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-2.5 py-[3px] rounded-full text-[11px] font-semibold font-mono"
      style={{ background: color + "18", color }}
    >
      {children}
    </span>
  );
}
