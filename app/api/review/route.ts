import { callAI } from "@/lib/ai-router";
import { computeRegime } from "@/lib/regime";
import Redis from "ioredis";
import type { Trend } from "@/lib/types";

const KV_TRENDS = "tc:trends";
const KV_REVIEW = "tc:review";
const KV_REVIEW_HISTORY = "tc:review_history";

interface ReviewResult {
  date: string;
  model?: string;
  trendUpdates: {
    id: string;
    name: string;
    field: string;
    oldValue: string | number;
    newValue: string | number;
    reason: string;
  }[];
  summary: string;
  applied: boolean;
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

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// GET: Return latest review + history. Also triggers review if called by Vercel cron.
export async function GET(req: Request) {
  // If called by Vercel cron, trigger a review
  const isCron = req.headers.get("x-vercel-cron") === "1" ||
                 new URL(req.url).searchParams.get("cron") === "1";

  if (isCron) {
    // Delegate to POST logic with empty body
    const postReq = new Request(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: false }),
    });
    return POST(postReq);
  }

  const redis = getRedis();
  let current: ReviewResult | null = null;
  let history: ReviewResult[] = [];

  if (redis) {
    try {
      const raw = await redis.get(KV_REVIEW);
      if (raw) current = JSON.parse(raw);
      const histRaw = await redis.get(KV_REVIEW_HISTORY);
      if (histRaw) history = JSON.parse(histRaw);
    } catch { /* fallback */ }
  }

  return Response.json({ current, history });
}

// POST: Run weekly review (or force)
export async function POST(req: Request) {
  const body = await req.json();
  const { force } = body;

  const redis = getRedis();
  let history: ReviewResult[] = [];

  // Check if review was done recently (within 6 days)
  if (redis && !force) {
    try {
      const raw = await redis.get(KV_REVIEW);
      if (raw) {
        const last: ReviewResult = JSON.parse(raw);
        if (last.date && daysSince(last.date) < 6) {
          const histRaw = await redis.get(KV_REVIEW_HISTORY);
          if (histRaw) history = JSON.parse(histRaw);
          return Response.json({ current: last, history, cached: true, nextReviewIn: 7 - daysSince(last.date) });
        }
      }
    } catch { /* proceed */ }
  }

  // Load current trends from Redis
  let trends: Trend[] = [];
  if (redis) {
    try {
      const raw = await redis.get(KV_TRENDS);
      if (raw) trends = JSON.parse(raw);
    } catch { /* empty */ }
  }

  if (!trends.length) {
    return Response.json({ error: "No trends found in storage" }, { status: 400 });
  }

  // Get regime for context
  let regimeSummary = "Regime data unavailable";
  try {
    const regime = await computeRegime();
    regimeSummary = `${regime.regime} (score ${regime.overallScore.toFixed(2)}). ${regime.summary}`;
  } catch { /* use fallback */ }

  const trendData = trends.map((t) =>
    `ID: ${t.id} | ${t.name} | Stage: ${t.stage}/4 | Confidence: ${t.confidence}% | Mispricing: ${t.mispricingScore}/100 | Horizon: ${t.horizon}\n  Thesis: ${t.thesis}\n  Bear: ${t.bearCase || "N/A"}`
  ).join("\n\n");

  const systemPrompt = `You are a disciplined macro strategist conducting a weekly portfolio review. You must follow these rules:

INERTIA RULES (critical):
1. Stage changes: max ±1 step per review. A trend at stage 2 can go to 1 or 3, never to 0 or 4 in one review.
2. Confidence changes: max ±10 points per review. 80% can go to 70-90%, never 50%.
3. Mispricing changes: max ±10 points per review.
4. Only propose changes with clear evidence — a news event, price action, or data shift. "I think" is not evidence.
5. Most weeks, most trends should have NO changes. A review with 0-3 changes is normal. 5+ changes in one week is suspicious.
6. Never remove a trend entirely. If a trend has played out, move it to stage 4 (Overcrowded).

WHAT TO REVIEW:
- Has anything happened in the last week that changes a trend's stage, confidence, or mispricing?
- Are any trends accelerating or decelerating based on the regime signals?
- Are any bear cases becoming more likely?
- Should any horizons be adjusted?`;

  const prompt = `CURRENT DATE: ${today()}
MARKET REGIME: ${regimeSummary}

CURRENT TRENDS TO REVIEW:
${trendData}

Review each trend. For trends with no changes, skip them entirely.

Return ONLY a valid JSON object:
{
  "updates": [
    {
      "id": "t1",
      "name": "AI & AGI Disruption",
      "field": "confidence",
      "oldValue": 85,
      "newValue": 80,
      "reason": "Cloud earnings Q1 showed AI capex ROI below expectations. Enterprise adoption slower than projected."
    }
  ],
  "summary": "2-4 sentences: How many trends changed? What was the primary driver this week? What to watch next week?"
}

If nothing has changed this week, return {"updates": [], "summary": "No material changes this week. [what to watch]"}`;

  try {
    const { result, model } = await callAI(systemPrompt, prompt, "synthesis");

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "AI returned invalid format", raw: result }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and apply inertia constraints
    const validUpdates = (parsed.updates || []).filter((u: { id: string; field: string; oldValue: number; newValue: number }) => {
      const trend = trends.find((t) => t.id === u.id);
      if (!trend) return false;

      if (u.field === "stage") {
        const diff = Math.abs(u.newValue - u.oldValue);
        return diff <= 1; // max ±1 step
      }
      if (u.field === "confidence" || u.field === "mispricingScore") {
        const diff = Math.abs(u.newValue - u.oldValue);
        return diff <= 10; // max ±10 points
      }
      return true;
    });

    const review: ReviewResult = {
      date: today(),
      model,
      trendUpdates: validUpdates,
      summary: parsed.summary || "",
      applied: false,
    };

    // Store review
    if (redis) {
      try {
        const histRaw = await redis.get(KV_REVIEW_HISTORY);
        if (histRaw) history = JSON.parse(histRaw);
        history = [...history.filter((h) => h.date !== today()), review].slice(-52); // keep 1 year
        await redis.set(KV_REVIEW, JSON.stringify(review));
        await redis.set(KV_REVIEW_HISTORY, JSON.stringify(history));
      } catch { /* best effort */ }
    }

    return Response.json({ current: review, history, cached: false });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// PATCH: Apply the review's suggested changes to trends
export async function PATCH() {
  const redis = getRedis();
  if (!redis) return Response.json({ error: "Redis not configured" }, { status: 500 });

  try {
    const reviewRaw = await redis.get(KV_REVIEW);
    if (!reviewRaw) return Response.json({ error: "No review to apply" }, { status: 404 });
    const review: ReviewResult = JSON.parse(reviewRaw);

    if (review.applied) return Response.json({ error: "Review already applied" }, { status: 400 });

    const trendsRaw = await redis.get(KV_TRENDS);
    if (!trendsRaw) return Response.json({ error: "No trends found" }, { status: 404 });
    let trends: Trend[] = JSON.parse(trendsRaw);

    // Apply each update
    for (const u of review.trendUpdates) {
      trends = trends.map((t) => {
        if (t.id !== u.id) return t;
        return { ...t, [u.field]: u.newValue };
      });
    }

    // Save updated trends
    await redis.set(KV_TRENDS, JSON.stringify(trends));

    // Mark review as applied
    review.applied = true;
    await redis.set(KV_REVIEW, JSON.stringify(review));

    return Response.json({ ok: true, updatedCount: review.trendUpdates.length });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
