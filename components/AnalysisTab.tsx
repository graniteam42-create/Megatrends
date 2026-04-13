"use client";

import { useState } from "react";
import type { Trend } from "@/lib/types";
import { STAGES, STAGE_COLORS, HORIZONS, CONVERGENCES } from "@/lib/seed-data";
import { StagePipeline, Meter, Badge } from "./StagePipeline";

interface ScanData {
  result: string;
  ts: string;
  model?: string;
}

export default function AnalysisTab({
  trends,
  setTrends,
  scans,
  setScans,
}: {
  trends: Trend[];
  setTrends: React.Dispatch<React.SetStateAction<Trend[]>>;
  scans: Record<string, ScanData>;
  setScans: React.Dispatch<React.SetStateAction<Record<string, ScanData>>>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [resultModel, setResultModel] = useState("");
  const empty = { name: "", stage: 0, horizon: "2-5 years", confidence: 50, description: "", subTrends: "", thesis: "", bearCase: "", investmentMap: "", mispricingScore: 50 };
  const [nf, setNf] = useState(empty);

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
              setLoading(true); setResult("");
              try {
                const data = await callAPI("Suggest 5 NEW mega-trends with specific tickers.", "Current: " + trends.map((t) => t.name).join(", "), "scan");
                setResult(data.error ? "Error: " + data.error : data.result);
                setResultModel(data.model || "");
              } catch (e: unknown) { setResult("Error: " + (e instanceof Error ? e.message : "Unknown")); } finally { setLoading(false); }
            }}
            disabled={loading}
          >
            Suggest
          </button>
          <button className="px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono" onClick={() => setShowAdd(!showAdd)}>+ Add</button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#00e5ff33] rounded-[10px] p-5 mb-4">
          <h3 className="text-[15px] text-[#00e5ff] font-semibold mb-3.5">New Mega-Trend</h3>
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
          <div className="mt-3"><label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Description</label><textarea className="w-full px-3.5 py-2.5 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none resize-y min-h-[70px]" value={nf.description} onChange={(e) => setNf({ ...nf, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3.5 mt-3">
            <div><label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Stage: {STAGES[nf.stage]}</label><input type="range" min={0} max={4} value={nf.stage} onChange={(e) => setNf({ ...nf, stage: +e.target.value })} className="w-full" /></div>
            <div><label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Confidence: {nf.confidence}%</label><input type="range" min={0} max={100} value={nf.confidence} onChange={(e) => setNf({ ...nf, confidence: +e.target.value })} className="w-full" /></div>
          </div>
          <div className="mt-3"><label className="text-[11px] text-[#64748b] uppercase tracking-widest font-mono block mb-1">Thesis</label><textarea className="w-full px-3.5 py-2.5 rounded-md border border-[#1e293b] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none resize-y min-h-[70px]" value={nf.thesis} onChange={(e) => setNf({ ...nf, thesis: e.target.value })} /></div>
          <div className="mt-3"><label className="text-[11px] text-[#ff1744] uppercase tracking-widest font-mono block mb-1">Bear Case</label><textarea className="w-full px-3.5 py-2.5 rounded-md border border-[#ff174433] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none resize-y min-h-[70px]" value={nf.bearCase} onChange={(e) => setNf({ ...nf, bearCase: e.target.value })} /></div>
          <div className="mt-3"><label className="text-[11px] text-[#00e676] uppercase tracking-widest font-mono block mb-1">Investment Map (tickers)</label><textarea className="w-full px-3.5 py-2.5 rounded-md border border-[#00e67633] bg-[#0d1117] text-[#e0e4ec] text-[13px] outline-none resize-y min-h-[70px]" value={nf.investmentMap} onChange={(e) => setNf({ ...nf, investmentMap: e.target.value })} /></div>
          <div className="mt-3.5 flex gap-2">
            <button className="px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono disabled:opacity-50" onClick={addTrend} disabled={!nf.name}>Save</button>
            <button className="px-4 py-2 rounded-md border border-[#1e293b] bg-white/[0.06] text-[#94a3b8] text-[13px] font-semibold font-mono" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {trends.map((t) => {
        const relConv = CONVERGENCES.filter((z) => z.trends.includes(t.id));
        return (
          <div key={t.id} className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-[10px] p-5 mb-3.5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h3 className="text-[17px] font-semibold">{t.name}</h3>
                  <Badge color={STAGE_COLORS[t.stage]}>{STAGES[t.stage]}</Badge>
                  <Badge color="#94a3b8">{t.horizon}</Badge>
                </div>
                <p className="text-[13px] text-[#94a3b8] leading-relaxed mb-2">{t.description}</p>
              </div>
              <div className="flex gap-1.5 ml-3">
                <button className="px-4 py-2 rounded-md bg-[#00e5ff] text-[#0a0c10] text-[13px] font-semibold font-mono disabled:opacity-50" onClick={() => doScan(t)} disabled={loading}>Scan</button>
                <button className="px-4 py-2 rounded-md bg-[rgba(255,23,68,0.15)] text-[#ff1744] border border-[#ff174433] text-[13px] font-semibold font-mono" onClick={() => setTrends((p) => p.filter((x) => x.id !== t.id))}>X</button>
              </div>
            </div>
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
