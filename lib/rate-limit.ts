// In-memory sliding-window rate limiter keyed by an identifier (e.g. IP or cookie).
// Lives in the serverless instance — good enough to slow abuse but not a global quota.
// For strict global limits, back this with Redis.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    // Simple LRU-ish eviction: if the map has grown too large, drop expired first.
    if (buckets.size >= MAX_KEYS) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k);
        if (buckets.size < MAX_KEYS) break;
      }
    }
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Extract a client identifier from a Next.js Request. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  // Fall back to cookie so logged-in users each get their own bucket.
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)tc_auth=([^;]+)/);
  return match ? `cookie:${match[1]}` : "anonymous";
}
