import { callAI } from "@/lib/ai-router";
import { kvGet, kvSet, KV_KEYS } from "@/lib/kv";
import { logger } from "@/lib/logger";
import { computeRegime } from "@/lib/regime";
import type { Trend } from "@/lib/types";
import { extractJsonObject, safeParse, validateReview } from "@/lib/validate";

interface ReviewResult {
  date: string;
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

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(req: Request) {
  const isCron =
    req.headers.get("x-vercel-cron") === "1" ||
    new URL(req.url).searchParams.get("cron") === "1";

  if (isCron) {
    const postReq = new Request(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: false }),
    });
    return POST(postReq);
  }

  const current = await kvGet<ReviewResult | null>(KV_KEYS.REVIEW, null);
  const history = await kvGet<ReviewResult[]>(KV_KEYS.REVIEW_HISTORY, []);
  return Response.json({ current, history });
}

export async function POST(req: Request) {
  let body: { force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // Allow empty body for cron trigger
  }
  const { force } = body;

  if (!force) {
    const last = await kvGet<ReviewResult | null>(KV_KEYS.REVIEW, null);
    if (last?.date && daysSince(last.date) < 6) {
      const history = await kvGet<ReviewResult[]>(KV_KEYS.REVIEW_HISTORY, []);
      return Response.json({
        current: last,
        history,
        cached: true,
        nextReviewIn: 7 - daysSince(last.date),
      });
    }
  }

  const trends = await kvGet<Trend[]>(KV_KEYS.TRENDS, []);
  if (!trends.length) {
    return Response.json({ error: "No trends found in storage" }, { status: 400 });
  }

  let regimeSummary = "Regime data unavailable";
  try {
    const regime = await computeRegime();
    regimeSummary = `${regime.regime} (score ${regime.overallScore.toFixed(2)}). ${regime.summary}`;
  } catch (e) {
    logger.warn("regime compute failed in review", {
      error: e instanceof Error ? e.message : String(e),
    });
  }

  const trendData = trends
    .map(
      (t) =>
        `ID: ${t.id} | ${t.name} | Stage: ${t.stage}/4 | Confidence: ${t.confidence}% | Mispricing: ${t.mispricingScore}/100 | Horizon: ${t.horizon}\n  Thesis: ${t.thesis}\n  Bear: ${t.bearCase || "N/A"}`
    )
    .join("\n\n");

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
    const { result } = await callAI(systemPrompt, prompt, "synthesis");
    const jsonString = extractJsonObject(result);
    if (!jsonString) {
      return Response.json({ error: "AI returned invalid format" }, { status: 500 });
    }
    const parsed = validateReview(safeParse(jsonString));
    if (!parsed) {
      return Response.json({ error: "AI response failed validation" }, { status: 500 });
    }

    const validUpdates = parsed.updates.filter((u) => {
      const trend = trends.find((t) => t.id === u.id);
      if (!trend) return false;
      if (u.field === "stage") {
        const diff = Math.abs(Number(u.newValue) - Number(u.oldValue));
        return diff <= 1;
      }
      if (u.field === "confidence" || u.field === "mispricingScore") {
        const diff = Math.abs(Number(u.newValue) - Number(u.oldValue));
        return diff <= 10;
      }
      return true;
    });

    const review: ReviewResult = {
      date: today(),
      trendUpdates: validUpdates,
      summary: parsed.summary,
      applied: false,
    };

    const history = await kvGet<ReviewResult[]>(KV_KEYS.REVIEW_HISTORY, []);
    const nextHistory = [...history.filter((h) => h.date !== today()), review].slice(-52);
    await kvSet(KV_KEYS.REVIEW, review);
    await kvSet(KV_KEYS.REVIEW_HISTORY, nextHistory);

    return Response.json({ current: review, history: nextHistory, cached: false });
  } catch (e: unknown) {
    logger.error("review generation failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    return Response.json({ error: "Review generation failed" }, { status: 500 });
  }
}

export async function PATCH() {
  const review = await kvGet<ReviewResult | null>(KV_KEYS.REVIEW, null);
  if (!review) return Response.json({ error: "No review to apply" }, { status: 404 });
  if (review.applied) return Response.json({ error: "Review already applied" }, { status: 400 });

  const trends = await kvGet<Trend[]>(KV_KEYS.TRENDS, []);
  if (!trends.length) return Response.json({ error: "No trends found" }, { status: 404 });

  const updated = trends.map((t) => {
    const change = review.trendUpdates.find((u) => u.id === t.id);
    if (!change) return t;
    return { ...t, [change.field]: change.newValue };
  });

  await kvSet(KV_KEYS.TRENDS, updated);
  await kvSet(KV_KEYS.REVIEW, { ...review, applied: true });

  return Response.json({ ok: true, updatedCount: review.trendUpdates.length });
}
