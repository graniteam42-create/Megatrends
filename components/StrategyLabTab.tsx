"use client";

import { useState } from "react";
import type { Trend } from "@/lib/types";
import { STAGES } from "@/lib/seed-data";

export default function StrategyLabTab({ trends }: { trends: Trend[] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [resultModel, setResultModel] = useState("");

  async function runAI(system: string, prompt: string, tier: "scan" | "synthesis") {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, prompt, tier }),
      });
      const data = await res.json();
      setResult(data.error ? "Error: " + data.error : data.result);
      setResultModel(data.model || "");
    } catch (e: unknown) {
      setResult("Error: " + (e instanceof Error ? e.message : "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
      icon: "\uD83D\uDCCA",
      title: "Full Synthesis",
      desc: "All trends into positions and timing",
      onClick: () =>
        runAI(
          "Synthesize mega-trends into positions. Specific tickers, timing, sizing.",
          `Trends:\n${trends.map((t) => `${t.name} [${STAGES[t.stage]}] ${t.confidence}%\nThesis: ${t.thesis}\nInvestments: ${t.investmentMap || "N/A"}`).join("\n\n")}\n\n1. Top 5 asymmetric plays (tickers)\n2. Asset class positioning\n3. Physical vs equity\n4. Hedges per scenario\n5. Timing\n6. Risks`,
          "synthesis"
        ),
    },
    {
      icon: "\uD83D\uDD2E",
      title: "Discover Trends",
      desc: "Emerging trends not on radar",
      onClick: () =>
        runAI(
          "Suggest 5 NEW mega-trends with specific tickers and mispricing scores.",
          "Current: " + trends.map((t) => t.name).join(", "),
          "scan"
        ),
    },
    {
      icon: "\uD83C\uDFAF",
      title: "Challenge Framework",
      desc: "Find flaws and blind spots",
      onClick: () =>
        runAI(
          "Contrarian analyst. Challenge aggressively. Be specific.",
          `${trends.map((t) => `${t.name} [${STAGES[t.stage]}] ${t.confidence}%\nThesis: ${t.thesis}\nBear: ${t.bearCase || "N/A"}`).join("\n\n")}\n\n1. Which WRONG?\n2. Missing?\n3. Contradictions?\n4. Biggest risk?\n5. Bet AGAINST which?`,
          "synthesis"
        ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-semibold mb-1.5">Strategy Lab</h2>
      <p className="text-[13px] text-[#64748b] mb-5">AI-powered tools to evolve the framework</p>
      <div className="grid grid-cols-3 gap-3.5">
        {cards.map((c, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] p-5 cursor-pointer text-center hover:border-[#00e5ff33] transition-colors"
            onClick={c.onClick}
          >
            <div className="text-[28px] mb-2">{c.icon}</div>
            <h3 className="text-[15px] font-semibold mb-1.5">{c.title}</h3>
            <p className="text-xs text-[#64748b]">{c.desc}</p>
          </div>
        ))}
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
