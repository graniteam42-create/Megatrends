import Redis from "ioredis";

let client: Redis | null = null;

function getClient(): Redis | null {
  if (client) return client;

  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;

  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true,
    });
    return client;
  } catch {
    return null;
  }
}

const KV_TRENDS = "tc:trends";
const KV_SCANS = "tc:scans";

export async function getTrends<T>(fallback: T): Promise<T> {
  const redis = getClient();
  if (!redis) return fallback;
  try {
    const raw = await redis.get(KV_TRENDS);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setTrends<T>(data: T): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(KV_TRENDS, JSON.stringify(data));
  } catch {
    // Silently fail — localStorage on client is backup
  }
}

export async function getScans<T>(fallback: T): Promise<T> {
  const redis = getClient();
  if (!redis) return fallback;
  try {
    const raw = await redis.get(KV_SCANS);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setScans<T>(data: T): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(KV_SCANS, JSON.stringify(data));
  } catch {
    // Silently fail
  }
}
