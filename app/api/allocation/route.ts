import { callAI } from "@/lib/ai-router";
import { computeRegime } from "@/lib/regime";
import Redis from "ioredis";

const KV_ALLOCATION = "tc:allocation";
const KV_ALLOCATION_HISTORY = "tc:allocation_history";

interface RegimeData {
  regime: string;
  overallScore: number;
  signals: { name: string; value: number | null; interpretation: string; score: number }[];
  summary: string;
  deployableTiers: number[];
  equityCorrelationCap: number;
}

interface AllocationEntry {
  date: string;
  allocations: { name: string; pct: number; color?: string }[];
  reasoning?: string;
  model?: string;
  regime?: RegimeData;
}

function getRedis(): Redis | null {
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;
  try {
    return new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 5000, lazyConnect: true });
  } catch { return null; }
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// GET: Return cached allocation + history
export async function GET() {
  const redis = getRedis();
  let current: AllocationEntry | null = null;
  let history: AllocationEntry[] = [];

  if (redis) {
    try {
      const raw = await redis.get(KV_ALLOCATION);
      if (raw) current = JSON.parse(raw);
      const histRaw = await redis.get(KV_ALLOCATION_HISTORY);
      if (histRaw) history = JSON.parse(histRaw);
    } catch { /* fallback below */ }
  }

  return Response.json({ current, history });
}

// POST: Generate new allocation via AI (only if not already done today)
export async function POST(req: Request) {
  const body = await req.json();
  const { trends, positions, prices, force } = body;

  const redis = getRedis();
  let current: AllocationEntry | null = null;
  let history: AllocationEntry[] = [];

  // Check if already generated today
  if (redis && !force) {
    try {
      const raw = await redis.get(KV_ALLOCATION);
      if (raw) {
        current = JSON.parse(raw);
        if (current && current.date === today()) {
          const histRaw = await redis.get(KV_ALLOCATION_HISTORY);
          if (histRaw) history = JSON.parse(histRaw);
          return Response.json({ current, history, cached: true });
        }
      }
    } catch { /* regenerate */ }
  }

  // --- Compute multi-factor regime assessment ---
  let regime;
  try {
    regime = await computeRegime();
  } catch {
    regime = null;
  }

  const regimeBlock = regime
    ? `REGIME ASSESSMENT (computed from ${regime.signals.length} independent indicators):
Overall: ${regime.regime} (composite score ${regime.overallScore.toFixed(2)})
Deployable tiers: ${regime.deployableTiers.join(", ")}
Max equity-correlated allocation: ${regime.equityCorrelationCap}%

Individual signals:
${regime.signals.map((s) => `• ${s.name}: ${s.value !== null ? s.value.toFixed?.(1) ?? s.value : "N/A"} → ${s.interpretation} [score: ${s.score > 0 ? "+" : ""}${s.score}]`).join("\n")}

Summary: ${regime.summary}`
    : "REGIME: Unable to compute — use conservative defaults (CAUTIOUS, deploy T1+T4 only, 30% equity-correlated cap)";

  // --- Build rich context ---

  const trendSummary = (trends || [])
    .map((t: { name: string; stage: number; confidence: number; mispricingScore: number; thesis: string; bearCase: string; investmentMap: string; horizon: string }) =>
      `• ${t.name} [Stage ${t.stage}/4, Confidence ${t.confidence}%, Mispricing ${t.mispricingScore}/100, Horizon ${t.horizon}]\n  Thesis: ${t.thesis}\n  Bear case: ${t.bearCase || "N/A"}\n  Tickers: ${t.investmentMap || "N/A"}`)
    .join("\n\n");

  const positionSummary = (positions || [])
    .map((p: { tier: number; dir: string; ticker: string; name: string; type: string; fee: string; conv: number; when: string; status: string; corr: string; why: string }) =>
      `• T${p.tier} ${p.dir} ${p.ticker} (${p.name}) — ${p.type}, fee ${p.fee}, conv ${p.conv}, corr: ${p.corr}\n  Status: ${p.status} | When: ${p.when}\n  Why: ${p.why}`)
    .join("\n\n");

  const priceMap = prices as Record<string, { close: number; change_p: number }> | null;
  const priceLines = priceMap
    ? Object.entries(priceMap)
        .filter(([, v]) => v && typeof v.close === "number")
        .map(([k, v]) => `${k}: $${v.close.toFixed(2)} (${v.change_p >= 0 ? "+" : ""}${v.change_p.toFixed(1)}%)`)
        .join(", ")
    : "No live prices";

  const systemPrompt = `You are a senior macro portfolio strategist managing a real portfolio for an EU-based investor. A multi-factor regime engine has analyzed up to 15 market indicators (EODHD end-of-day closes for ETF/index proxies + FRED for macro fundamentals) and determined the current regime. You MUST respect its output — do not override the regime classification or deployable tiers.

Data note: EODHD provides historical closing prices (not real-time). Price momentum signals use 20-day and 60-day close-to-close returns. FRED data is released with 1-2 day lag. This is appropriate for a macro portfolio that rebalances weekly/monthly.

You must think through the allocation step by step using this investment framework:

FRAMEWORK RULES (non-negotiable):
1. PHYSICAL vs MINERS: Physical commodity ETCs (WGLD, WSLV, SPUT, OD7C) are anti-correlated to equities — deploy them NOW regardless of market conditions. Miners (GDX, WNUC, RARE, CCJ) carry equity beta — deploy ONLY during corrections (VIX>30 or -15%+ drawdown).
2. CORRELATION-AWARE TIMING: If markets are calm (VIX<20), overweight physical + hedges. If VIX 20-30, start scaling into miners. If VIX>30, deploy crash watchlist aggressively.
3. TIER SYSTEM: T1 (Physical) = core, always deployed. T2 (Miners/Sectors) = deploy on correction. T3 (Individual stocks) = high conviction, research individually. T4 (Hedges/Long horizon) = small, patient capital.
4. SCENARIO WEIGHTING: Base case "Managed Grind" 50% (slow debasement, gold+uranium+infra), Bear case "Great Repricing" 30% (liquidity crisis, overweight anti-correlated physical), Bull case "Productivity Renaissance" 20% (AI delivers, long quality tech+nuclear).
5. FEE DISCIPLINE: Always prefer lowest-fee option (WGLD 0.12% over VZLD 0.39%). Futures-based ETCs have 3-5% hidden roll cost — avoid.
6. EU INVESTOR CONSTRAINTS: PRIIPs blocks US inverse ETFs. Use EU-listed alternatives (3TYS for short bonds, bear certificates via Avanza Markets for short equity).
7. CASH IS A POSITION: If nothing is attractive at current prices, hold cash. Don't force allocation.
8. DOTCOM SURVIVOR STRATEGY: Quality AI/infra companies (NVDA, AVGO, GEV, ETN) will crash with the junk during AI trough of disillusionment. The crash watchlist is for buying those at -40 to -60% off highs, NOT at current prices.

REASONING STEPS (follow these in order):
Step 1: READ the regime assessment below — it already analyzed VIX, credit spreads, gold, dollar, copper/gold ratio, breadth, bonds, bitcoin correlation, and energy. Do NOT override its regime classification.
Step 2: RESPECT the deployable tiers from the regime engine. If it says T1+T4 only, do NOT allocate to miners or individual stocks.
Step 3: RESPECT the equity-correlated cap. Sum all equity-correlated allocations and ensure they stay under the cap.
Step 4: Weight within deployable tiers by trend confidence × mispricing score. Higher product = higher allocation.
Step 5: Read each signal interpretation — if gold is surging, overweight physical gold. If credit is stressing, overweight anti-correlated. If dollar is weakening, commodity tailwind.
Step 6: Apply scenario weights — 50% base, 30% bear, 20% bull. The portfolio must survive the bear case.
Step 7: Check if any crash watchlist names are in buy zones (only relevant in STRESSED or CRISIS regime).
Step 8: Size hedges proportional to total equity-correlated exposure.
Step 9: Assign remainder to cash/dry powder if conditions don't warrant full deployment.`;

  const prompt = `CURRENT DATE: ${today()}

${regimeBlock}

MEGA-TRENDS:
${trendSummary || "No trends defined"}

AVAILABLE POSITIONS:
${positionSummary || "No positions defined"}

LIVE PRICES: ${priceLines}

Based on the framework rules and reasoning steps above, construct a portfolio allocation totaling exactly 100%.

Return ONLY a valid JSON object with these fields:
{
  "allocations": [
    {"name": "Physical Gold (WGLD)", "pct": 20},
    {"name": "Cash / Dry Powder", "pct": 10},
    ...
  ],
  "reasoning": "4-6 sentences: State the regime and its key drivers. Which signals most influenced the allocation? What's the main tension or trade-off? What specific signal change would trigger a rebalance (e.g. 'if VIX crosses 30' or 'if credit spreads widen further')?"
}

Requirements:
- Allocations must sum to exactly 100
- Use actual ticker symbols in parentheses
- 8-15 line items
- Be specific: "Physical Gold (WGLD)" not "Gold"
- Include cash/dry powder if warranted
- Every allocation decision must follow from the framework`;

  try {
    const { result, model } = await callAI(systemPrompt, prompt, "synthesis");

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "AI returned invalid format", raw: result }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const entry: AllocationEntry = {
      date: today(),
      allocations: parsed.allocations || [],
      reasoning: parsed.reasoning || "",
      model,
      regime: regime ? {
        regime: regime.regime,
        overallScore: regime.overallScore,
        signals: regime.signals,
        summary: regime.summary,
        deployableTiers: regime.deployableTiers,
        equityCorrelationCap: regime.equityCorrelationCap,
      } : undefined,
    };

    // Validate allocations sum
    const total = entry.allocations.reduce((s, a) => s + (a.pct || 0), 0);
    if (total < 95 || total > 105) {
      // AI sometimes doesn't sum to exactly 100 — normalize
      const factor = 100 / total;
      entry.allocations = entry.allocations.map((a) => ({ ...a, pct: Math.round(a.pct * factor) }));
      // Fix rounding to exactly 100
      const newTotal = entry.allocations.reduce((s, a) => s + a.pct, 0);
      if (newTotal !== 100 && entry.allocations.length > 0) {
        entry.allocations[0].pct += 100 - newTotal;
      }
    }

    // Persist to Redis
    if (redis) {
      try {
        const histRaw = await redis.get(KV_ALLOCATION_HISTORY);
        if (histRaw) history = JSON.parse(histRaw);
        history = [...history.filter((h) => h.date !== today()), entry].slice(-90);
        await redis.set(KV_ALLOCATION, JSON.stringify(entry));
        await redis.set(KV_ALLOCATION_HISTORY, JSON.stringify(history));
      } catch { /* best effort */ }
    }

    return Response.json({ current: entry, history, cached: false });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
