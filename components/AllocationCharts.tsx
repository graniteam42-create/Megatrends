"use client";

import { useState } from "react";

interface Allocation {
  name: string;
  pct: number;
  color?: string;
}

interface AllocationEntry {
  date: string;
  allocations: Allocation[];
  reasoning?: string;
  model?: string;
}

// Consistent palette for pie slices
const PALETTE = [
  "#00e5ff", "#00e676", "#ffea00", "#ff9100", "#c084fc",
  "#0ea5e9", "#f59e0b", "#ec4899", "#14b8a6", "#ff1744",
  "#a78bfa", "#34d399", "#fbbf24", "#f87171", "#38bdf8",
];

function getSliceColor(index: number, name: string): string {
  // Assign stable colors based on asset type keywords
  const lower = name.toLowerCase();
  if (lower.includes("gold")) return "#ffea00";
  if (lower.includes("silver")) return "#94a3b8";
  if (lower.includes("uranium") || lower.includes("nuclear")) return "#00e676";
  if (lower.includes("copper")) return "#ff9100";
  if (lower.includes("bitcoin") || lower.includes("crypto")) return "#f59e0b";
  if (lower.includes("cash") || lower.includes("reserve")) return "#475569";
  if (lower.includes("defense") || lower.includes("defence")) return "#ff1744";
  if (lower.includes("cyber") || lower.includes("security")) return "#0ea5e9";
  if (lower.includes("health") || lower.includes("pharma")) return "#c084fc";
  if (lower.includes("hedge") || lower.includes("short")) return "#f87171";
  return PALETTE[index % PALETTE.length];
}

// SVG Pie Chart
export function PieChart({ allocations }: { allocations: Allocation[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 85;

  // Sort by pct descending for better visual
  const sorted = [...allocations].sort((a, b) => b.pct - a.pct);
  let cumulative = 0;

  const slices = sorted.map((a, i) => {
    const startAngle = (cumulative / 100) * 2 * Math.PI - Math.PI / 2;
    cumulative += a.pct;
    const endAngle = (cumulative / 100) * 2 * Math.PI - Math.PI / 2;
    const largeArc = a.pct > 50 ? 1 : 0;
    const color = a.color || getSliceColor(i, a.name);

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    // Label position at midpoint of arc
    const midAngle = (startAngle + endAngle) / 2;
    const labelR = r * 0.65;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    const isHovered = hovered === i;
    const outerR = isHovered ? r + 6 : r;
    const ox1 = cx + outerR * Math.cos(startAngle);
    const oy1 = cy + outerR * Math.sin(startAngle);
    const ox2 = cx + outerR * Math.cos(endAngle);
    const oy2 = cy + outerR * Math.sin(endAngle);

    const path = a.pct >= 100
      ? `M ${cx} ${cy - outerR} A ${outerR} ${outerR} 0 1 1 ${cx - 0.01} ${cy - outerR} Z`
      : `M ${cx} ${cy} L ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2} Z`;

    return { ...a, path, color, lx, ly, midAngle, index: i };
  });

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-[220px] h-[220px] shrink-0">
        {slices.map((s) => (
          <path
            key={s.index}
            d={s.path}
            fill={s.color}
            fillOpacity={hovered !== null && hovered !== s.index ? 0.3 : 0.85}
            stroke="#0a0c10"
            strokeWidth={1.5}
            onMouseEnter={() => setHovered(s.index)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer transition-opacity duration-150"
          />
        ))}
        {slices.map((s) => (
          s.pct >= 5 && (
            <text
              key={`label-${s.index}`}
              x={s.lx}
              y={s.ly}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#0a0c10"
              fontSize={s.pct >= 10 ? 11 : 9}
              fontWeight={700}
              fontFamily="JetBrains Mono, monospace"
              pointerEvents="none"
            >
              {s.pct}%
            </text>
          )
        ))}
      </svg>
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-1 gap-[3px]">
          {slices.map((s) => (
            <div
              key={s.index}
              className="flex items-center gap-2 px-2 py-[3px] rounded cursor-default transition-colors"
              style={{ background: hovered === s.index ? s.color + "15" : "transparent" }}
              onMouseEnter={() => setHovered(s.index)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="text-[12px] text-[#cbd5e1] truncate flex-1">{s.name}</span>
              <span className="text-[12px] font-mono font-bold shrink-0" style={{ color: s.color }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stacked area chart showing allocation history over time
export function AllocationHistory({ history }: { history: AllocationEntry[] }) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  if (history.length < 2) {
    return (
      <div className="text-[12px] text-[#475569] py-4 text-center">
        Allocation history will appear after 2+ days of data.
      </div>
    );
  }

  // Get all unique asset names across history
  const allAssets = [...new Set(history.flatMap((h) => h.allocations.map((a) => a.name)))];
  // Assign stable colors
  const assetColors: Record<string, string> = {};
  allAssets.forEach((name, i) => { assetColors[name] = getSliceColor(i, name); });

  const W = 600;
  const H = 200;
  const padL = 35;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Build stacked data: for each date, cumulative percentages
  const stackedData = history.map((h, di) => {
    const x = padL + (di / (history.length - 1)) * chartW;
    let cum = 0;
    const layers = allAssets.map((asset) => {
      const alloc = h.allocations.find((a) => a.name === asset);
      const pct = alloc?.pct || 0;
      const y0 = cum;
      cum += pct;
      return { asset, y0, y1: cum, pct };
    });
    return { date: h.date, x, layers };
  });

  // Build area paths per asset (bottom to top)
  const areaPaths = allAssets.map((asset) => {
    const topPoints = stackedData.map((d) => {
      const layer = d.layers.find((l) => l.asset === asset)!;
      const y = padT + chartH - (layer.y1 / 100) * chartH;
      return `${d.x},${y}`;
    });
    const bottomPoints = [...stackedData].reverse().map((d) => {
      const layer = d.layers.find((l) => l.asset === asset)!;
      const y = padT + chartH - (layer.y0 / 100) * chartH;
      return `${d.x},${y}`;
    });
    return {
      asset,
      path: `M ${topPoints.join(" L ")} L ${bottomPoints.join(" L ")} Z`,
      color: assetColors[asset],
    };
  });

  // Date labels (show first, last, and a few in between)
  const labelIndices = [0, Math.floor(history.length / 2), history.length - 1].filter(
    (v, i, arr) => arr.indexOf(v) === i
  );

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 400, maxHeight: 220 }}>
        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = padT + chartH - (v / 100) * chartH;
          return (
            <g key={v}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#1e293b" strokeWidth={0.5} />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="#475569" fontSize={9} fontFamily="JetBrains Mono, monospace">{v}%</text>
            </g>
          );
        })}
        {/* Stacked areas */}
        {areaPaths.map((a) => (
          <path key={a.asset} d={a.path} fill={a.color} fillOpacity={0.6} stroke={a.color} strokeWidth={0.5} />
        ))}
        {/* Hover columns */}
        {stackedData.map((d, i) => (
          <rect
            key={d.date}
            x={d.x - chartW / history.length / 2}
            y={padT}
            width={chartW / history.length}
            height={chartH}
            fill="transparent"
            onMouseEnter={() => setHoveredDate(d.date)}
            onMouseLeave={() => setHoveredDate(null)}
            className="cursor-crosshair"
          />
        ))}
        {/* Hover line */}
        {hoveredDate && (() => {
          const d = stackedData.find((s) => s.date === hoveredDate);
          if (!d) return null;
          return <line x1={d.x} x2={d.x} y1={padT} y2={padT + chartH} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3,3" />;
        })()}
        {/* Date labels */}
        {labelIndices.map((idx) => {
          const d = stackedData[idx];
          return (
            <text key={idx} x={d.x} y={H - 6} textAnchor="middle" fill="#475569" fontSize={9} fontFamily="JetBrains Mono, monospace">
              {d.date.slice(5)} {/* MM-DD */}
            </text>
          );
        })}
      </svg>
      {/* Hover tooltip */}
      {hoveredDate && (() => {
        const entry = history.find((h) => h.date === hoveredDate);
        if (!entry) return null;
        return (
          <div className="mt-2 px-3 py-2 bg-[#111827] border border-[#1e293b] rounded-lg">
            <span className="text-[11px] font-mono text-[#475569]">{hoveredDate}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {entry.allocations.filter((a) => a.pct > 0).sort((a, b) => b.pct - a.pct).map((a, i) => (
                <span key={i} className="text-[11px] text-[#cbd5e1]">
                  <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: assetColors[a.name] || PALETTE[i % PALETTE.length] }} />
                  {a.name}: <span className="font-mono font-bold">{a.pct}%</span>
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
