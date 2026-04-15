"use client";

import { useState, useEffect } from "react";
import type { Trend } from "@/lib/types";
import { STAGES, STAGE_COLORS, HORIZONS, CONVERGENCES, getTrendImage } from "@/lib/seed-data";
import { extractBenchmarkTicker } from "@/lib/ticker-map";
import { StagePipeline, Meter, Badge } from "./StagePipeline";

interface ScanData {
  result: string;
  ts: string;
  model?: string;
}

function parseAIJson(text: string) {
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
}

export default function AnalysisTab({
  trends,
  setTrends,
  scans,
  setScans,
  focusTrendId,
  onFocusHandled,
}: {
  trends: Trend[];
  setTrends: React.Dispatch<React.SetStateAction<Trend[]>>;
  scans: Record<string, ScanData>;
  setScans: React.Dispatch<React.SetStateAction<Record<string, ScanData>>>;
  focusTrendId?: string | null;
  onFocusHandled?: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [resultModel, setResultModel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const empty = { name: "", stage: 0, horizon: "2-5 years", confidence: 50, description: "", subTrends: "", thesis: "", bearCase: "", investmentMap: "", mispricingScore: 50 };
  const [nf, setNf] = useState(empty);

  // Scroll to focused trend when navigating from Landscape
  useEffect(() => {
    if (focusTrendId) {
      const el = document.getElementById(`trend-${focusTrendId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.outline = "2px solid #00e5ff";
        setTimeout(() => { el.style.outline = ""; }, 2000);
      }
      onFocusHandled?.();
    }
  }, [focusTrendId, onFocusHandled]);

  // Scan modal state
  const [scanModal, setScanModal] = useState<{ trendName: string; trendId: string } | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

  // Feature 1: AI-Assisted Trend Research Flow
  const [researchPhase, setResearchPhase] = useState<"idle" | "researching" | "assessing" | "ready">("idle");
  const [assessment, setAssessment] = useState("");

  // Feature 2: Selectable AI Suggestions
  const [suggestions, setSuggestions] = useState<Partial<Trend>[]>([]);

  async function callAPI(system: string, prompt: string, tier: "scan" | "synthesis") {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, prompt, tier }),
    });
    return res.json();
  }

  function addTrend() {
    const investMap = typeof nf.investmentMap === "string" ? nf.investmentMap : "";
    setTrends((p) => [
      ...p,
      {
        ...nf,
        id: "t" + Date.now(),
        subTrends: nf.subTrends.split(",").map((x: string) => x.trim()).filter(Boolean),
        signals: [],
        confidence: +nf.confidence,
        stage: +nf.stage,
        mispricingScore: +nf.mispricingScore,
        benchmarkTicker: extractBenchmarkTicker(investMap),
      } as unknown as Trend,
    ]);
    setNf(empty);
    setShowAdd(false);
    setResearchPhase("idle");
    setAssessment("");
  }

  async function doResearch() {
    if (!nf.name.trim()) return;
    setResearchPhase("researching");
    try {
      const data = await callAPI(
        "You are a strategic intelligence analyst. Given a trend name, research it thoroughly and return a JSON object with these exact fields: description (2-3 sentences), thesis (investment thesis, 1-2 sentences), bearCase (strongest counter-argument, 1-2 sentences), investmentMap (specific tickers like NVDA, ASML with Long/Short), confidence (0-100 number), mispricingScore (0-100 number), subTrends (array of 3-5 strings), stage (0-4 where 0=Nascent, 1=Emerging, 2=Accelerating, 3=Consensus, 4=Overcrowded), horizon (one of: 6-18 months, 2-5 years, 5-15 years). Return ONLY valid JSON, no markdown fences.",
        nf.name,
        "scan"
      );
      if (data.error) {
        setResearchPhase("idle");
        setResult("Error: " + data.error);
        return;
      }
      const parsed = parseAIJson(data.result);
      setNf({
        name: nf.name,
        description: parsed.description || "",
        thesis: parsed.thesis || "",
        bearCase: parsed.bearCase || "",
        investmentMap: parsed.investmentMap || "",
        confidence: parsed.confidence ?? 50,
        mispricingScore: parsed.mispricingScore ?? 50,
        subTrends: Array.isArray(parsed.subTrends) ? parsed.subTrends.join(", ") : (parsed.subTrends || ""),
        stage: parsed.stage ?? 0,
        horizon: parsed.horizon || "2-5 years",
      });

      // Now get assessment
      setResearchPhase("assessing");
      const fieldsSummary = `Trend: ${nf.name}\nDescription: ${parsed.description}\nThesis: ${parsed.thesis}\nBear Case: ${parsed.bearCase}\nInvestment Map: ${parsed.investmentMap}\nConfidence: ${parsed.confidence}%\nMispricing Score: ${parsed.mispricingScore}\nSub-Trends: ${Array.isArray(parsed.subTrends) ? parsed.subTrends.join(", ") : parsed.subTrends}\nStage: ${STAGES[parsed.stage] || "Unknown"}\nHorizon: ${parsed.horizon}`;
      const assessData = await callAPI(
        "Impartial investment analyst. Evaluate this proposed mega-trend objectively. Be critical and specific.",
        fieldsSummary + "\n\n1. Probability this trend plays out as described (%)\n2. Can investors realistically make money on this? (High/Medium/Low with explanation)\n3. Recommendation: ADD to watchlist or SKIP (with reasoning)",
        "synthesis"
      );
      if (assessData.error) {
        setAssessment("Recommendation unavailable (" + assessData.error + "). You can still review the AI-populated fields and add the trend.");
      } else {
        setAssessment(assessData.result);
      }
      setResearchPhase("ready");
    } catch (e: unknown) {
      setResearchPhase("idle");
      setResult("Research failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  }

  async function doScan(t: Trend) {
    setScanModal({ trendName: t.name, trendId: t.id });
    setScanLoading(true);
    try {
      const data = await callAPI(
        "Strategic intelligence analyst. Return a structured analysis using markdown headers (##) for each section. Use bullet points. Be concise - max 2-3 bullet points per section. Specific tickers.",
        `Scan: ${t.name}\n${t.description}\nStage: ${STAGES[t.stage]}\nThesis: ${t.thesis}\nBear: ${t.bearCase || "N/A"}\n\nReturn these sections:\n## Latest Signals\n## Bull Case\n## Bear Case\n## Stage Assessment\n## Mispricing Score\n## Key Tickers\n## Watchpoints`,
        "scan"
      );
      if (data.error) {
        setScans((p) => ({ ...p, [t.id]: { result: "Error: " + data.error, ts: new Date().toISOString(), model: "" } }));
      } else {
        setScans((p) => ({ ...p, [t.id]: { result: data.result, ts: new Date().toISOString(), model: data.model } }));
      }
    } catch (e: unknown) {
      setScans((p) => ({ ...p, [t.id]: { result: "Scan failed: " + (e instanceof Error ? e.message : "Unknown"), ts: new Date().toISOString(), model: "" } }));
    } finally {
      setScanLoading(false);
    }
  }

  function renderFormattedScan(text: string) {
    const sections = text.split(/^##\s+/m).filter(Boolean);
    if (sections.length <= 1) {
      // Fallback: not markdown-structured, render with basic formatting
      return text.split("\n").map((line, i) => {
        if (line.startsWith("###") || line.startsWith("**#")) {
          return <h4 key={i} className="text-[13px] font-bold text-[#00e5ff] mt-4 mb-1">{line.replace(/^[#*\s]+/, "").replace(/\*+$/, "")}</h4>;
        }
        if (line.match(/^\*\*[^*]+\*\*/)) {
          return <h4 key={i} className="text-[13px] font-bold text-[#e0e4ec] mt-3 mb-1">{line.replace(/\*\*/g, "")}</h4>;
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return <li key={i} className="text-[13px] text-[#cbd5e1] ml-4 mb-0.5 list-disc">{line.slice(2)}</li>;
        }
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-[13px] text-[#cbd5e1] mb-0.5">{line}</p>;
      });
    }
    return sections.map((section, i) => {
      const lines = section.split("\n");
      const title = lines[0].trim();
      const body = lines.slice(1).join("\n").trim();
      const color = title.includes("Bull") ? "#00e676" : title.includes("Bear") ? "#ff1744" : title.includes("Ticker") ? "#00e5ff" : title.includes("Signal") ? "#ffea00" : "#c084fc";
      return (
        <div key={i} className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1 h-4 rounded-full" style={{ background: color }} />
            <h4 className="text-[13px] font-bold uppercase tracking-wider" style={{ color }}>{title}</h4>
          </div>
          <div className="pl-3 text-[13px] text-[#cbd5e1] leading-relaxed">
            {body.split("\n").map((line, j) => {
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return <li key={j} className="ml-3 mb-1 list-disc">{line.slice(2)}</li>;
              }
              if (line.trim() === "") return null;
              return <p key={j} className="mb-1">{line}</p>;
            })}
          </div>
        </div>
      );
    });
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold">Deep Analysis</h2>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">{trends.length} trends tracked</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter trends..."
              className="w-full sm:w-52 px-3 py-2 pl-8 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-[13px] font-mono outline-none focus:border-[#00e5ff66] placeholder:text-[#475569]"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.3-4.3" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-md border border-[#1e293b] bg-white/[0.06] text-[#94a3b8] text-[13px] font-semibold font-mono hover:bg-white/[0.1] disabled:opacity-50"
            onClick={async () => {
              setLoading(true);
              setResult("");
              setSuggestions([]);
              try {
                const data = await callAPI(
                  "Suggest 5 NEW mega-trends NOT in the user's current list. IMPORTANT: For investmentMap tickers, strongly prefer tickers available on EODHD (US-listed stocks and ETFs, or major EU-listed ETFs on XETRA/LSE). Avoid obscure EU instruments, certificates, or tickers unlikely to have price data. Return a JSON array of 5 objects, each with: name, description, thesis, bearCase, investmentMap, confidence (0-100), mispricingScore (0-100), subTrends (string array), stage (0-4), horizon (string). Return ONLY valid JSON, no markdown fences.",
                  "Current trends: " + trends.map((t) => t.name).join(", "),
                  "scan"
                );
                if (data.error) {
                  setResult("Error: " + data.error);
                  setResultModel(data.model || "");
                } else {
                  try {
                    const parsed = parseAIJson(data.result);
                    if (Array.isArray(parsed)) {
                      setSuggestions(parsed);
                      setResult("");
                    } else {
                      setResult(data.result);
                    }
                  } catch {
                    // Fallback to raw text display
                    setResult(data.result);
                  }
                  setResultModel(data.model || "");
                }
              } catch (e: unknown) {
                setResult("Error: " + (e instanceof Error ? e.message : "Unknown"));
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            Suggest
          </button>
          <button
            className="px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono"
            onClick={() => {
              setShowAdd(!showAdd);
              if (!showAdd) {
                setResearchPhase("idle");
                setAssessment("");
                setNf(empty);
              }
            }}
          >
            + Add
          </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#00e5ff33] rounded-[10px] p-5 mb-4">
          <h3 className="text-[15px] text-[#00e5ff] font-semibold mb-3.5">New Mega-Trend</h3>

          {researchPhase === "idle" && (
            <>
              <div>
                <label className="text-[11px] text-[#94a3b8] uppercase tracking-widest font-mono block mb-1">Trend Name</label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-sm outline-none"
                  value={nf.name}
                  onChange={(e) => setNf({ ...nf, name: e.target.value })}
                  placeholder="Enter a mega-trend name..."
                />
              </div>
              <div className="mt-3.5 flex gap-2">
                <button
                  className="px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono disabled:opacity-50"
                  onClick={doResearch}
                  disabled={!nf.name.trim()}
                >
                  Research with AI
                </button>
                <button
                  className="px-4 py-2 rounded-md border border-[#1e293b] bg-white/[0.06] text-[#94a3b8] text-[13px] font-semibold font-mono"
                  onClick={() => { setShowAdd(false); setNf(empty); setResearchPhase("idle"); setAssessment(""); }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {researchPhase === "researching" && (
            <div className="py-8 text-center animate-pulse">
              <div className="inline-block w-4 h-4 border-2 border-[#1e293b] border-t-[#00e5ff] rounded-full animate-spin" />
              <p className="mt-3 text-[13px] text-[#0ea5e9]">Researching...</p>
            </div>
          )}

          {researchPhase === "assessing" && (
            <div className="py-8 text-center animate-pulse">
              <div className="inline-block w-4 h-4 border-2 border-[#1e293b] border-t-[#c084fc] rounded-full animate-spin" />
              <p className="mt-3 text-[13px] text-[#c084fc]">Getting recommendation...</p>
            </div>
          )}

          {researchPhase === "ready" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] text-[#94a3b8] uppercase tracking-widest font-mono block mb-1">Name</label>
                  <input className="w-full px-3.5 py-2.5 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-sm outline-none" value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] uppercase tracking-widest font-mono block mb-1">Horizon</label>
                  <select className="w-full px-3 py-2 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none" value={nf.horizon} onChange={(e) => setNf({ ...nf, horizon: e.target.value })}>
                    {HORIZONS.map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-[#94a3b8] uppercase tracking-widest font-mono block mb-1">Description</label>
                <textarea className="w-full px-3.5 py-2.5 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none resize-y min-h-[70px]" value={nf.description} onChange={(e) => setNf({ ...nf, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
                <div>
                  <label className="text-[11px] text-[#94a3b8] uppercase tracking-widest font-mono block mb-1">Stage: {STAGES[nf.stage]}</label>
                  <input type="range" min={0} max={4} value={nf.stage} onChange={(e) => setNf({ ...nf, stage: +e.target.value })} className="w-full" />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] uppercase tracking-widest font-mono block mb-1">Confidence: {nf.confidence}%</label>
                  <input type="range" min={0} max={100} value={nf.confidence} onChange={(e) => setNf({ ...nf, confidence: +e.target.value })} className="w-full" />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-[#94a3b8] uppercase tracking-widest font-mono block mb-1">Mispricing Score: {nf.mispricingScore}</label>
                <input type="range" min={0} max={100} value={nf.mispricingScore} onChange={(e) => setNf({ ...nf, mispricingScore: +e.target.value })} className="w-full" />
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-[#94a3b8] uppercase tracking-widest font-mono block mb-1">Sub-Trends (comma-separated)</label>
                <input className="w-full px-3.5 py-2.5 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none" value={nf.subTrends} onChange={(e) => setNf({ ...nf, subTrends: e.target.value })} />
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-[#94a3b8] uppercase tracking-widest font-mono block mb-1">Thesis</label>
                <textarea className="w-full px-3.5 py-2.5 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none resize-y min-h-[70px]" value={nf.thesis} onChange={(e) => setNf({ ...nf, thesis: e.target.value })} />
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-[#ff1744] uppercase tracking-widest font-mono block mb-1">Bear Case</label>
                <textarea className="w-full px-3.5 py-2.5 rounded-md border border-[#ff174433] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none resize-y min-h-[70px]" value={nf.bearCase} onChange={(e) => setNf({ ...nf, bearCase: e.target.value })} />
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-[#00e676] uppercase tracking-widest font-mono block mb-1">Investment Map (tickers)</label>
                <textarea className="w-full px-3.5 py-2.5 rounded-md border border-[#00e67633] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none resize-y min-h-[70px]" value={nf.investmentMap} onChange={(e) => setNf({ ...nf, investmentMap: e.target.value })} />
              </div>

              {assessment && (
                <div className="mt-4 bg-gradient-to-br from-[#0c1a2e] to-[#0f1623] border border-[#c084fc33] rounded-[10px] p-5">
                  <span className="text-[11px] text-[#c084fc] font-mono font-semibold uppercase tracking-widest block mb-2">AI Recommendation</span>
                  <div className="text-[13px] text-[#cbd5e1] leading-[1.7] whitespace-pre-wrap">{assessment}</div>
                </div>
              )}

              <div className="mt-3.5 flex gap-2">
                <button
                  className="px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono disabled:opacity-50"
                  onClick={addTrend}
                  disabled={!nf.name}
                >
                  Add Trend
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-[rgba(255,23,68,0.15)] text-[#ff1744] border border-[#ff174433] text-[13px] font-semibold font-mono"
                  onClick={() => { setShowAdd(false); setNf(empty); setResearchPhase("idle"); setAssessment(""); }}
                >
                  Discard
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Feature 2: Suggestions Panel */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] p-5 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] text-[#00e5ff] font-semibold">AI Suggestions</h3>
            <button
              className="px-3 py-1.5 rounded-md border border-[#1e293b] bg-white/[0.06] text-[#94a3b8] text-[12px] font-semibold font-mono hover:bg-white/[0.1]"
              onClick={() => setSuggestions([])}
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-[#0d1117] border border-[#1e293b] rounded-lg p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[15px] font-semibold text-[#e0e4ec]">{s.name}</span>
                    {s.stage !== undefined && (
                      <Badge color={STAGE_COLORS[s.stage] || "#94a3b8"}>{STAGES[s.stage] || "Unknown"}</Badge>
                    )}
                  </div>
                  <p className="text-[13px] text-[#94a3b8] leading-relaxed mb-2">{s.description}</p>
                  <div className="flex gap-4 text-[11px] font-mono">
                    {s.confidence !== undefined && (
                      <span className="text-[#00e5ff]">Confidence: {s.confidence}%</span>
                    )}
                    {s.mispricingScore !== undefined && (
                      <span className="text-[#ffea00]">Mispricing: {s.mispricingScore}</span>
                    )}
                  </div>
                </div>
                <button
                  className="px-3 py-1.5 rounded-md bg-[#00e676] text-[#0a0c10] text-[12px] font-semibold font-mono flex-shrink-0"
                  onClick={() => {
                    const investMap = s.investmentMap || "";
                    const newTrend: Trend = {
                      id: "t" + Date.now(),
                      name: s.name || "Untitled",
                      description: s.description || "",
                      thesis: s.thesis || "",
                      bearCase: s.bearCase || "",
                      investmentMap: investMap,
                      confidence: s.confidence ?? 50,
                      mispricingScore: s.mispricingScore ?? 50,
                      subTrends: Array.isArray(s.subTrends) ? s.subTrends : [],
                      stage: s.stage ?? 0,
                      horizon: s.horizon || "2-5 years",
                      signals: [],
                      benchmarkTicker: extractBenchmarkTicker(investMap),
                    };
                    setTrends((p) => [...p, newTrend]);
                    setSuggestions((prev) => prev.filter((_, idx) => idx !== i));
                  }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {trends.filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.subTrends.some((s) => s.toLowerCase().includes(q));
      }).map((t) => {
        const relConv = CONVERGENCES.filter((z) => z.trends.includes(t.id));
        return (
          <div key={t.id} id={`trend-${t.id}`} className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] overflow-hidden mb-3.5">
            {(() => {
              const img = getTrendImage(t.id, t.name, t.description);
              return img ? (
              <div className="relative h-44 w-full">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#11182700] via-[#11182766] to-[#111827]" />
                <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-[19px] font-bold drop-shadow-lg">{t.name}</h3>
                    <Badge color={STAGE_COLORS[t.stage]}>{STAGES[t.stage]}</Badge>
                    <Badge color="#94a3b8">{t.horizon}</Badge>
                    {t.benchmarkTicker && <Badge color="#00e5ff">{t.benchmarkTicker}</Badge>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button className="px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono disabled:opacity-50" onClick={() => doScan(t)} disabled={loading}>Scan</button>
                    <button className="px-4 py-2 rounded-md bg-[rgba(255,23,68,0.15)] text-[#ff1744] border border-[#ff174433] text-[13px] font-semibold font-mono" onClick={() => setDeleteConfirm({ id: t.id, name: t.name })}>X</button>
                  </div>
                </div>
              </div>
              ) : (
              <div className="p-5 pb-0 flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <h3 className="text-[17px] font-semibold">{t.name}</h3>
                    <Badge color={STAGE_COLORS[t.stage]}>{STAGES[t.stage]}</Badge>
                    <Badge color="#94a3b8">{t.horizon}</Badge>
                    {t.benchmarkTicker && <Badge color="#00e5ff">{t.benchmarkTicker}</Badge>}
                  </div>
                </div>
                <div className="flex gap-1.5 ml-3 shrink-0">
                  <button className="px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono disabled:opacity-50" onClick={() => doScan(t)} disabled={loading}>Scan</button>
                  <button className="px-4 py-2 rounded-md bg-[rgba(255,23,68,0.15)] text-[#ff1744] border border-[#ff174433] text-[13px] font-semibold font-mono" onClick={() => setDeleteConfirm({ id: t.id, name: t.name })}>X</button>
                </div>
              </div>
              );
            })()}
            <div className="p-5">
            <p className="text-[13px] text-[#94a3b8] leading-relaxed mb-2">{t.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <StagePipeline stage={t.stage} onChange={(v) => setTrends((p) => p.map((x) => (x.id === t.id ? { ...x, stage: v } : x)))} />
              <div className="flex gap-3">
                <div className="flex-1"><Meter label="Mispricing" value={t.mispricingScore} /></div>
                <div className="flex-1"><Meter label="Confidence" value={t.confidence} /></div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {t.subTrends.map((x, i) => (
                <span key={i} className="inline-block px-2 py-[2px] rounded text-[11px] bg-white/5 text-[#94a3b8]">{x}</span>
              ))}
            </div>
            {t.thesis && (
              <div className="mt-2.5 px-3.5 py-2.5 bg-[rgba(0,229,255,0.04)] rounded-md border-l-[3px] border-l-[#00e5ff]">
                <span className="text-[11px] text-[#94a3b8] uppercase tracking-widest font-mono block mb-1">Thesis</span>
                <p className="text-[13px] text-[#cbd5e1] leading-relaxed">{t.thesis}</p>
              </div>
            )}
            {t.bearCase && (
              <div className="mt-2 px-3.5 py-2.5 bg-[rgba(255,23,68,0.04)] rounded-md border-l-[3px] border-l-[#ff1744]">
                <span className="text-[11px] text-[#ff1744] uppercase tracking-widest font-mono block mb-1">Bear Case</span>
                <p className="text-[13px] text-[#94a3b8] leading-relaxed italic">{t.bearCase}</p>
              </div>
            )}
            {t.investmentMap && (
              <div className="mt-2 px-3.5 py-2.5 bg-[rgba(0,230,118,0.04)] rounded-md border-l-[3px] border-l-[#00e676]">
                <span className="text-[11px] text-[#00e676] uppercase tracking-widest font-mono block mb-1">Investment Map</span>
                <p className="text-[13px] text-[#cbd5e1] leading-relaxed">{t.investmentMap}</p>
              </div>
            )}
            {relConv.length > 0 && (
              <div className="mt-3">
                <span className="text-[11px] text-[#c084fc] uppercase tracking-widest font-mono block mb-2">Convergence Zones</span>
                {relConv.map((z, i) => {
                  const ot = trends.find((x) => x.id === z.trends.find((id) => id !== t.id));
                  return (
                    <div key={i} className="px-3 py-2 bg-[rgba(74,29,142,0.08)] rounded-md border-l-2 border-l-[#4a1d8e] mb-1.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-[#c084fc]">{z.name}</span>
                        <span className="text-[10px] text-[#475569]">x</span>
                        <Badge color="#475569">{ot ? ot.name : ""}</Badge>
                      </div>
                      <p className="text-[11px] text-[#94a3b8] leading-snug">{z.insight}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {scans[t.id] && (
              <div
                className="mt-3 px-3.5 py-2.5 bg-[rgba(0,229,255,0.04)] rounded-md border border-[#0e4b7a33] cursor-pointer hover:border-[#0e4b7a] transition-colors flex justify-between items-center"
                onClick={() => setScanModal({ trendName: t.name, trendId: t.id })}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#0ea5e9] font-mono font-semibold">AI SCAN{scans[t.id].model ? ` via ${scans[t.id].model}` : ""}</span>
                  <span className="text-[10px] text-[#475569]">{new Date(scans[t.id].ts).toLocaleString()}</span>
                </div>
                <span className="text-[11px] text-[#475569]">Click to view</span>
              </div>
            )}
          </div>
          </div>
        );
      })}

      {/* Loading / Result Modal */}
      {(loading || result) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0c10]/80 backdrop-blur-sm" onClick={() => !loading && setResult("")}>
          <div className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#111827] border-b border-[#1e293b] px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h3 className="text-[15px] font-bold text-[#00e5ff]">AI Analysis</h3>
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

      {/* Scan Modal */}
      {scanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0c10]/80 backdrop-blur-sm" onClick={() => !scanLoading && setScanModal(null)}>
          <div className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#111827] border-b border-[#1e293b] px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-[15px] font-bold text-[#00e5ff]">{scanModal.trendName}</h3>
                <span className="text-[11px] text-[#475569] font-mono">AI SCAN{scans[scanModal.trendId]?.model ? ` via ${scans[scanModal.trendId].model}` : ""}</span>
              </div>
              {!scanLoading && (
                <button onClick={() => setScanModal(null)} className="text-[#64748b] hover:text-[#e0e4ec] text-lg px-2">X</button>
              )}
            </div>
            <div className="px-6 py-5">
              {scanLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block w-5 h-5 border-2 border-[#1e293b] border-t-[#00e5ff] rounded-full animate-spin" />
                  <p className="mt-3 text-[13px] text-[#0ea5e9]">Scanning {scanModal.trendName}...</p>
                </div>
              ) : scans[scanModal.trendId] ? (
                <>
                  <div className="text-[10px] text-[#475569] mb-4">{new Date(scans[scanModal.trendId].ts).toLocaleString()}</div>
                  {renderFormattedScan(scans[scanModal.trendId].result)}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0c10]/80 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#ff174433] rounded-xl w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5">
              <h3 className="text-[15px] font-bold text-[#ff1744] mb-2">Remove Trend</h3>
              <p className="text-[13px] text-[#cbd5e1] mb-1">Are you sure you want to remove:</p>
              <p className="text-[14px] font-semibold text-[#e0e4ec] mb-4">{deleteConfirm.name}</p>
              <p className="text-[12px] text-[#94a3b8] mb-5">This will remove the trend and its scan data. This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 rounded-md border border-[#1e293b] bg-white/[0.06] text-[#94a3b8] text-[13px] font-semibold font-mono hover:bg-white/[0.1]"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-[#ff1744] text-white text-[13px] font-semibold font-mono hover:bg-[#ff1744dd]"
                  onClick={() => {
                    setTrends((p) => p.filter((x) => x.id !== deleteConfirm.id));
                    setScans((p) => {
                      const next = { ...p };
                      delete next[deleteConfirm.id];
                      return next;
                    });
                    setDeleteConfirm(null);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
