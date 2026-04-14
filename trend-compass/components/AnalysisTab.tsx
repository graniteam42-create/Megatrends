"use client";

import { useState, useEffect } from "react";
import type { Trend } from "@/lib/types";
import { STAGES, STAGE_COLORS, HORIZONS, CONVERGENCES, TREND_IMAGES } from "@/lib/seed-data";
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
    setLoading(true);
    setResult("");
    try {
      const data = await callAPI(
        "Strategic intelligence analyst. Specific tickers. Recent developments.",
        `Scan: ${t.name}\n${t.description}\nStage: ${STAGES[t.stage]}\nThesis: ${t.thesis}\nBear: ${t.bearCase || "N/A"}\n\n1. Latest Signals\n2. Bull vs Bear\n3. Stage Assessment\n4. Mispricing\n5. Investments (tickers)\n6. Watchpoints`,
        "scan"
      );
      if (data.error) {
        setResult("Error: " + data.error);
      } else {
        setResult(data.result);
        setResultModel(data.model || "");
        setScans((p) => ({ ...p, [t.id]: { result: data.result, ts: new Date().toISOString(), model: data.model } }));
      }
    } catch (e: unknown) {
      setResult("Scan failed: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold">Deep Analysis</h2>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-md border border-[#1e293b] bg-white/[0.06] text-[#94a3b8] text-[13px] font-semibold font-mono hover:bg-white/[0.1] disabled:opacity-50"
            onClick={async () => {
              setLoading(true);
              setResult("");
              setSuggestions([]);
              try {
                const data = await callAPI(
                  "Suggest 5 NEW mega-trends NOT in the user's current list. Return a JSON array of 5 objects, each with: name, description, thesis, bearCase, investmentMap, confidence (0-100), mispricingScore (0-100), subTrends (string array), stage (0-4), horizon (string). Return ONLY valid JSON, no markdown fences.",
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

      {showAdd && (
        <div className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#00e5ff33] rounded-[10px] p-5 mb-4">
          <h3 className="text-[15px] text-[#00e5ff] font-semibold mb-3.5">New Mega-Trend</h3>

          {researchPhase === "idle" && (
            <>
              <div>
                <label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Trend Name</label>
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
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Name</label>
                  <input className="w-full px-3.5 py-2.5 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-sm outline-none" value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Horizon</label>
                  <select className="w-full px-3 py-2 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none" value={nf.horizon} onChange={(e) => setNf({ ...nf, horizon: e.target.value })}>
                    {HORIZONS.map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Description</label>
                <textarea className="w-full px-3.5 py-2.5 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none resize-y min-h-[70px]" value={nf.description} onChange={(e) => setNf({ ...nf, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3.5 mt-3">
                <div>
                  <label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Stage: {STAGES[nf.stage]}</label>
                  <input type="range" min={0} max={4} value={nf.stage} onChange={(e) => setNf({ ...nf, stage: +e.target.value })} className="w-full" />
                </div>
                <div>
                  <label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Confidence: {nf.confidence}%</label>
                  <input type="range" min={0} max={100} value={nf.confidence} onChange={(e) => setNf({ ...nf, confidence: +e.target.value })} className="w-full" />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Mispricing Score: {nf.mispricingScore}</label>
                <input type="range" min={0} max={100} value={nf.mispricingScore} onChange={(e) => setNf({ ...nf, mispricingScore: +e.target.value })} className="w-full" />
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Sub-Trends (comma-separated)</label>
                <input className="w-full px-3.5 py-2.5 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none" value={nf.subTrends} onChange={(e) => setNf({ ...nf, subTrends: e.target.value })} />
              </div>
              <div className="mt-3">
                <label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Thesis</label>
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
                    const newTrend: Trend = {
                      id: "t" + Date.now(),
                      name: s.name || "Untitled",
                      description: s.description || "",
                      thesis: s.thesis || "",
                      bearCase: s.bearCase || "",
                      investmentMap: s.investmentMap || "",
                      confidence: s.confidence ?? 50,
                      mispricingScore: s.mispricingScore ?? 50,
                      subTrends: Array.isArray(s.subTrends) ? s.subTrends : [],
                      stage: s.stage ?? 0,
                      horizon: s.horizon || "2-5 years",
                      signals: [],
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

      {trends.map((t) => {
        const relConv = CONVERGENCES.filter((z) => z.trends.includes(t.id));
        return (
          <div key={t.id} id={`trend-${t.id}`} className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] overflow-hidden mb-3.5">
            {TREND_IMAGES[t.id] && (
              <div className="relative h-44 w-full">
                <img src={TREND_IMAGES[t.id].url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#11182700] via-[#11182766] to-[#111827]" />
                <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[19px] font-bold drop-shadow-lg">{t.name}</h3>
                    <Badge color={STAGE_COLORS[t.stage]}>{STAGES[t.stage]}</Badge>
                    <Badge color="#94a3b8">{t.horizon}</Badge>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono disabled:opacity-50" onClick={() => doScan(t)} disabled={loading}>Scan</button>
                    <button className="px-4 py-2 rounded-md bg-[rgba(255,23,68,0.15)] text-[#ff1744] border border-[#ff174433] text-[13px] font-semibold font-mono" onClick={() => setTrends((p) => p.filter((x) => x.id !== t.id))}>X</button>
                  </div>
                </div>
              </div>
            )}
            <div className="p-5">
            {!TREND_IMAGES[t.id] && (
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h3 className="text-[17px] font-semibold">{t.name}</h3>
                  <Badge color={STAGE_COLORS[t.stage]}>{STAGES[t.stage]}</Badge>
                  <Badge color="#94a3b8">{t.horizon}</Badge>
                </div>
              </div>
              <div className="flex gap-1.5 ml-3">
                <button className="px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono disabled:opacity-50" onClick={() => doScan(t)} disabled={loading}>Scan</button>
                <button className="px-4 py-2 rounded-md bg-[rgba(255,23,68,0.15)] text-[#ff1744] border border-[#ff174433] text-[13px] font-semibold font-mono" onClick={() => setTrends((p) => p.filter((x) => x.id !== t.id))}>X</button>
              </div>
            </div>
            )}
            <p className="text-[13px] text-[#94a3b8] leading-relaxed mb-2">{t.description}</p>
            <div className="grid grid-cols-2 gap-3.5">
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
                <span className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Thesis</span>
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
              <div className="mt-3 bg-gradient-to-br from-[#0c1a2e] to-[#0f1623] border border-[#0e4b7a] rounded-[10px] p-5">
                <div className="flex justify-between mb-2">
                  <span className="text-[11px] text-[#0ea5e9] font-mono font-semibold">AI SCAN{scans[t.id].model ? ` via ${scans[t.id].model}` : ""}</span>
                  <span className="text-[10px] text-[#475569]">{new Date(scans[t.id].ts).toLocaleString()}</span>
                </div>
                <div className="text-[13px] text-[#cbd5e1] leading-[1.7] whitespace-pre-wrap">{scans[t.id].result}</div>
              </div>
            )}
          </div>
          </div>
        );
      })}

      {loading && (
        <div className="bg-gradient-to-br from-[#0c1a2e] to-[#0f1623] border border-[#0e4b7a] rounded-[10px] p-10 text-center animate-pulse mt-4">
          <div className="inline-block w-4 h-4 border-2 border-[#1e293b] border-t-[#00e5ff] rounded-full animate-spin" />
          <p className="mt-3 text-[13px] text-[#0ea5e9]">Analyzing...</p>
        </div>
      )}
      {result && !loading && (
        <div className="bg-gradient-to-br from-[#0c1a2e] to-[#0f1623] border border-[#0e4b7a] rounded-[10px] p-5 mt-4 animate-fadeIn">
          <span className="text-[11px] text-[#00e676] font-mono font-semibold">AI ANALYSIS{resultModel ? ` via ${resultModel}` : ""}</span>
          <div className="mt-3 text-[13px] text-[#cbd5e1] leading-[1.7] whitespace-pre-wrap">{result}</div>
        </div>
      )}
    </div>
  );
}
