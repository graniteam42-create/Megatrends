import Redis from "ioredis";
import { logger } from "./logger";

let client: Redis | null = null;
let connectionFailed = false;

function getClient(): Redis | null {
  if (client) return client;
  if (connectionFailed) return null;

  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;

  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) {
          connectionFailed = true;
          return null;
        }
        return Math.min(times * 500, 2000);
      },
      reconnectOnError() {
        return true;
      },
    });
    client.on("error", (err) => {
      logger.warn("Redis error", { error: err.message });
    });
    return client;
  } catch (e) {
    connectionFailed = true;
    logger.warn("Redis init failed", { error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

async function safeGet(key: string): Promise<string | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (e) {
    logger.warn("kv get failed", { key, error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

async function safeSet(key: string, value: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(key, value);
  } catch (e) {
    logger.warn("kv set failed", { key, error: e instanceof Error ? e.message : String(e) });
  }
}

export const KV_KEYS = {
  TRENDS: "tc:trends",
  SCANS: "tc:scans",
  ALLOCATION: "tc:allocation",
  ALLOCATION_HISTORY: "tc:allocation_history",
  REVIEW: "tc:review",
  REVIEW_HISTORY: "tc:review_history",
} as const;

export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  const raw = await safeGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    logger.warn("kv parse failed", { key, error: e instanceof Error ? e.message : String(e) });
    return fallback;
  }
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  await safeSet(key, JSON.stringify(value));
}

export function kvEnabled(): boolean {
  return Boolean(getClient());
}

// Backwards-compatible wrappers used by existing routes.
export async function getTrends<T>(fallback: T): Promise<T> {
  return kvGet<T>(KV_KEYS.TRENDS, fallback);
}
export async function setTrends<T>(data: T): Promise<void> {
  return kvSet<T>(KV_KEYS.TRENDS, data);
}
export async function getScans<T>(fallback: T): Promise<T> {
  return kvGet<T>(KV_KEYS.SCANS, fallback);
}
export async function setScans<T>(data: T): Promise<void> {
  return kvSet<T>(KV_KEYS.SCANS, data);
}
