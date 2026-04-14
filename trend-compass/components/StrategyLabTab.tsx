"use client";

import { useState } from "react";
import type { Trend } from "@/lib/types";
import { STAGES } from "@/lib/seed-data";

function renderAIResult(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.match(/^#{1,3}\s/)) {
      const clean = line.replace(/^#+\s*/, "").replace(/\*\*/g, "");
      return <h4 key={i} className="text-[14px] font-bold text-[#00e5ff] mt-5 mb-2 pb-1 border-b border-[#1e293b]">{clean}</h4>;
    }
    if (line.match(/^\*\*[^*]+\*\*/)) {
      return <h4 key={i} className="text-[13px] font-bold text-[#e0e4ec] mt-4 mb-1">{line.replace(/\*\*/g, "")}</h4>;
    }
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\.\s(.*)/)!;
      return <div key={i} className="flex gap-2 mb-2 ml-1"><span className="text-[#00e5ff] font-mono font-bold shrink-0">{num[1]}.</span><span className="text-[13px] text-[#cbd5e1]">{num[2]}</span></div>;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return <li key={i} className="text-[13px] text-[#cbd5e1] ml-4 mb-1.5 list-disc">{line.slice(2)}</li>;
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <p key={i} className="text-[13px] text-[#cbd5e1] mb-1 leading-relaxed">{line}</p>;
  });
}

export default function StrategyLabTab({ trends }: { trends: Trend[] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [resultModel, setResultModel] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  async function runAI(title: string, system: string, prompt: string, tier: "scan" | "synthesis") {
    setModalTitle(title);
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
      title: "Full Synthesis",
      desc: "Synthesize all trends into concrete positions, tickers, timing, and sizing",
      gradient: "from-[#00e5ff] to-[#0ea5e9]",
      glow: "rgba(0,229,255,0.12)",
      onClick: () =>
        runAI(
          "Full Synthesis",
          "Synthesize mega-trends into positions. Use markdown ## headers for each section. Use bullet points. Be concise and specific with tickers.",
          `Trends:\n${trends.map((t) => `${t.name} [${STAGES[t.stage]}] ${t.confidence}%\nThesis: ${t.thesis}\nInvestments: ${t.investmentMap || "N/A"}`).join("\n\n")}\n\nReturn these sections:\n## Top 5 Asymmetric Plays\n## Asset Class Positioning\n## Physical vs Equity Split\n## Hedges by Scenario\n## Timing & Entry Points\n## Key Risks`,
          "synthesis"
        ),
    },
    {
      title: "Discover Trends",
      desc: "Find 5 emerging mega-trends not on your radar, with tickers and mispricing analysis",
      gradient: "from-[#c084fc] to-[#7c3aed]",
      glow: "rgba(192,132,252,0.12)",
      onClick: () =>
        runAI(
          "Discover Trends",
          "Suggest 5 NEW mega-trends. Use markdown ## for each trend name. Under each, bullet points for: thesis, key tickers, why mispriced. Be concise.",
          "Current trends: " + trends.map((t) => t.name).join(", "),
          "scan"
        ),
    },
    {
      title: "Challenge Framework",
      desc: "Play contrarian analyst - find flaws, contradictions, and blind spots in your thesis",
      gradient: "from-[#ff6b6b] to-[#ff1744]",
      glow: "rgba(255,23,68,0.12)",
      onClick: () =>
        runAI(
          "Challenge Framework",
          "Contrarian analyst. Challenge aggressively. Use markdown ## headers for each section. Bullet points. Be specific with tickers and numbers.",
          `${trends.map((t) => `${t.name} [${STAGES[t.stage]}] ${t.confidence}%\nThesis: ${t.thesis}\nBear: ${t.bearCase || "N/A"}`).join("\n\n")}\n\nReturn these sections:\n## Trends Most Likely Wrong\n## Blind Spots & Missing Trends\n## Internal Contradictions\n## Biggest Single Risk\n## Bet Against (specific tickers to short)`,
          "synthesis"
        ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-semibold mb-1.5">Strategy Lab</h2>
      <p className="text-[13px] text-[#94a3b8] mb-6">AI-powered tools to stress-test and evolve your investment framework</p>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <button
            key={i}
            disabled={loading}
            onClick={c.onClick}
            className="group relative rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] text-left"
            style={{ boxShadow: `0 0 24px ${c.glow}` }}
          >
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${c.gradient}`} />
            <div className="bg-[#111827] px-5 py-5 h-full border border-[#1e293b] border-t-0 rounded-xl group-hover:bg-[#151d2e] transition-colors">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${c.gradient} shrink-0 group-hover:scale-125 transition-transform`} />
                <h3 className="text-[15px] font-bold tracking-wide">{c.title}</h3>
              </div>
              <p className="text-[12px] text-[#64748b] leading-relaxed group-hover:text-[#94a3b8] transition-colors">{c.desc}</p>
              <div className={`mt-3 text-[11px] font-mono font-semibold bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>
                Run analysis &#x203A;
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* AI Modal */}
      {(loading || result) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0c10]/80 backdrop-blur-sm" onClick={() => !loading && setResult("")}>
          <div className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#111827] border-b border-[#1e293b] px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h3 className="text-[15px] font-bold text-[#00e5ff]">{modalTitle}</h3>
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
                renderAIResult(result)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
