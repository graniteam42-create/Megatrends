import { callAI } from "@/lib/ai-router";
import Redis from "ioredis";

const KV_ALLOCATION = "tc:allocation";
const KV_ALLOCATION_HISTORY = "tc:allocation_history";

interface AllocationEntry {
  date: string;
  allocations: { name: string; pct: number; color?: string }[];
  reasoning?: string;
  model?: string;
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

  // Build context for AI
  const trendSummary = (trends || [])
    .map((t: { name: string; stage: number; confidence: number; thesis: string; investmentMap: string }) =>
      `${t.name} [stage ${t.stage}/4, confidence ${t.confidence}%]: ${t.thesis}. Tickers: ${t.investmentMap || "N/A"}`)
    .join("\n");

  const positionSummary = (positions || [])
    .map((p: { dir: string; ticker: string; name: string; conv: number; when: string; status: string }) =>
      `${p.dir} ${p.ticker} (${p.name}) conv:${p.conv} status:${p.status} when:${p.when}`)
    .join("\n");

  const priceContext = prices
    ? Object.entries(prices as Record<string, { close: number; change_p: number }>)
        .filter(([, v]) => v && typeof v.close === "number")
        .map(([k, v]) => `${k}: $${v.close.toFixed(2)} (${v.change_p >= 0 ? "+" : ""}${v.change_p.toFixed(1)}%)`)
        .join(", ")
    : "No live prices available";

  const prompt = `Given these mega-trends, positions, and market data, recommend a full portfolio allocation totaling 100%.

TRENDS:
${trendSummary || "No trends defined"}

POSITIONS:
${positionSummary || "No positions defined"}

LIVE PRICES: ${priceContext}

DATE: ${today()}

Rules:
- Allocations must sum to exactly 100%
- Use specific asset names (e.g. "Physical Gold (WGLD)" not just "Gold")
- Include 8-15 line items
- Consider trend confidence, stage, timing signals, and current prices
- Physical commodities can be deployed now; miners only on correction
- Include hedges and cash if appropriate
- Be opinionated based on current market conditions

Return ONLY a valid JSON object (no markdown fences) with these fields:
{
  "allocations": [{"name": "Asset Name (TICKER)", "pct": 15}, ...],
  "reasoning": "2-3 sentences explaining the key allocation decisions and what changed vs. a neutral stance"
}`;

  try {
    const { result, model } = await callAI(
      "You are a quantitative portfolio strategist. Return precise allocation percentages based on macro trends and market conditions. Be specific with asset names and tickers.",
      prompt,
      "synthesis"
    );

    // Parse AI response
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
    };

    // Persist to Redis
    if (redis) {
      try {
        // Load existing history
        const histRaw = await redis.get(KV_ALLOCATION_HISTORY);
        if (histRaw) history = JSON.parse(histRaw);

        // Add to history (keep last 90 days)
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
