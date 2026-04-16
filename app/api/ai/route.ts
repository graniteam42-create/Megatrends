import { callAI } from "@/lib/ai-router";
import { logger } from "@/lib/logger";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { asString } from "@/lib/validate";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30; // per minute per client

export async function POST(req: Request) {
  const key = clientKey(req);
  const limit = rateLimit(`ai:${key}`, MAX_REQUESTS, WINDOW_MS);
  if (!limit.allowed) {
    return Response.json(
      { error: "Rate limit exceeded. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((limit.resetAt - Date.now()) / 1000).toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let system = "";
  let prompt = "";
  let tier: "scan" | "synthesis" = "scan";
  try {
    const body = await req.json();
    system = asString(body?.system);
    prompt = asString(body?.prompt);
    tier = body?.tier === "synthesis" ? "synthesis" : "scan";
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!prompt) {
    return Response.json({ error: "Missing prompt" }, { status: 400 });
  }

  try {
    const { result } = await callAI(system, prompt, tier);
    // Intentionally omit the provider/model name — don't leak infrastructure details to the client.
    return Response.json(
      { result },
      { headers: { "X-RateLimit-Remaining": limit.remaining.toString() } }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    logger.error("AI call failed", { tier, error: message });
    return Response.json({ error: "AI request failed" }, { status: 500 });
  }
}
