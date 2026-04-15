"use client";

import { useState, useMemo } from "react";
import type { Trend, Convergence } from "@/lib/types";
import { STAGE_COLORS } from "@/lib/seed-data";

const NODE_RADIUS = 28;
const WIDTH = 800;
const HEIGHT = 480;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;

export default function ConvergenceNetwork({
  trends,
  convergences,
}: {
  trends: Trend[];
  convergences: Convergence[];
}) {
  const [hoveredTrend, setHoveredTrend] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);

  // Position trends in an ellipse
  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const rx = WIDTH * 0.38;
    const ry = HEIGHT * 0.38;
    trends.forEach((t, i) => {
      const angle = (2 * Math.PI * i) / trends.length - Math.PI / 2;
      pos[t.id] = {
        x: CX + rx * Math.cos(angle),
        y: CY + ry * Math.sin(angle),
      };
    });
    return pos;
  }, [trends]);

  // Count connections per trend
  const connectionCount = useMemo(() => {
    const counts: Record<string, number> = {};
    convergences.forEach((c) => {
      c.trends.forEach((tid) => {
        counts[tid] = (counts[tid] || 0) + 1;
      });
    });
    return counts;
  }, [convergences]);

  // Highlighted edges when hovering a trend
  const highlightedEdges = useMemo(() => {
    if (!hoveredTrend) return new Set<number>();
    const set = new Set<number>();
    convergences.forEach((c, i) => {
      if (c.trends.includes(hoveredTrend)) set.add(i);
    });
    return set;
  }, [hoveredTrend, convergences]);

  const highlightedTrends = useMemo(() => {
    if (!hoveredTrend) return new Set<string>();
    const set = new Set<string>([hoveredTrend]);
    convergences.forEach((c) => {
      if (c.trends.includes(hoveredTrend)) {
        c.trends.forEach((tid) => set.add(tid));
      }
    });
    return set;
  }, [hoveredTrend, convergences]);

  function shortName(name: string): string {
    const abbrevs: Record<string, string> = {
      "AI & AGI Disruption": "AI",
      "Financial Repression & Fiat Debasement": "Fiat",
      "Climate Acceleration & Energy Transition": "Energy",
      "Geopolitical Fragmentation": "Geopolit.",
      "Demographic Inversion": "Demogr.",
      "Trust Crisis & Verification Economy": "Trust",
      "Commodities Financialization": "Commod.",
      "Synthetic Biology": "SynBio",
      "Strategic Bridge States": "Bridge",
      "Carbon as Feedstock": "Carbon",
    };
    return abbrevs[name] || (name.length > 8 ? name.slice(0, 7) + "." : name);
  }

  return (
    <div className="mt-2 rounded-[10px] border border-[#1e293b] bg-[#0d1117] overflow-hidden">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ maxHeight: 480 }}
      >
        {/* Edges */}
        {convergences.map((c, i) => {
          const from = positions[c.trends[0]];
          const to = positions[c.trends[1]];
          if (!from || !to) return null;
          const isHovered = hoveredEdge === i || highlightedEdges.has(i);
          return (
            <g key={`edge-${i}`}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHovered ? "#c084fc" : "#1e293b"}
                strokeWidth={isHovered ? 2.5 : 1}
                strokeOpacity={hoveredTrend && !highlightedEdges.has(i) ? 0.15 : isHovered ? 1 : 0.5}
                className="transition-all duration-200"
              />
              {/* Invisible wider hit area for hover */}
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="transparent"
                strokeWidth={12}
                onMouseEnter={() => setHoveredEdge(i)}
                onMouseLeave={() => setHoveredEdge(null)}
                className="cursor-pointer"
              />
              {/* Edge label on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={(from.x + to.x) / 2 - c.name.length * 3.2}
                    y={(from.y + to.y) / 2 - 12}
                    width={c.name.length * 6.4}
                    height={20}
                    rx={4}
                    fill="#111827"
                    stroke="#c084fc"
                    strokeWidth={1}
                    opacity={0.95}
                  />
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 + 2}
                    textAnchor="middle"
                    fill="#c084fc"
                    fontSize={10}
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight={600}
                  >
                    {c.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {trends.map((t) => {
          const pos = positions[t.id];
          if (!pos) return null;
          const color = STAGE_COLORS[t.stage];
          const conns = connectionCount[t.id] || 0;
          const isActive = !hoveredTrend || highlightedTrends.has(t.id);
          const r = NODE_RADIUS + conns * 1.5;
          return (
            <g
              key={t.id}
              onMouseEnter={() => setHoveredTrend(t.id)}
              onMouseLeave={() => setHoveredTrend(null)}
              className="cursor-pointer"
              opacity={isActive ? 1 : 0.2}
              style={{ transition: "opacity 0.2s" }}
            >
              {/* Glow */}
              {(hoveredTrend === t.id) && (
                <circle cx={pos.x} cy={pos.y} r={r + 6} fill={color} opacity={0.15} />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill="#111827"
                stroke={color}
                strokeWidth={hoveredTrend === t.id ? 2.5 : 1.5}
              />
              <text
                x={pos.x}
                y={pos.y - 3}
                textAnchor="middle"
                fill={color}
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                fontWeight={700}
              >
                {shortName(t.name)}
              </text>
              <text
                x={pos.x}
                y={pos.y + 11}
                textAnchor="middle"
                fill="#64748b"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
              >
                {conns} link{conns !== 1 ? "s" : ""}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip with convergence insight when hovering an edge */}
      {hoveredEdge !== null && convergences[hoveredEdge] && (
        <div className="px-4 py-2.5 border-t border-[#1e293b] bg-[#111827]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c084fc]" />
            <span className="text-[12px] font-mono font-semibold text-[#c084fc]">{convergences[hoveredEdge].name}</span>
          </div>
          <p className="text-[12px] text-[#94a3b8] leading-relaxed">{convergences[hoveredEdge].insight}</p>
        </div>
      )}
    </div>
  );
}
