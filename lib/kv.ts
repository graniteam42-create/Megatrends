import { kv } from "@vercel/kv";

const KV_TRENDS = "tc:trends";
const KV_SCANS = "tc:scans";

function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function getTrends<T>(fallback: T): Promise<T> {
  if (!isKvConfigured()) return fallback;
  try {
    const data = await kv.get<T>(KV_TRENDS);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setTrends<T>(data: T): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(KV_TRENDS, data);
  } catch {
    // Silently fail — localStorage on client is backup
  }
}

export async function getScans<T>(fallback: T): Promise<T> {
  if (!isKvConfigured()) return fallback;
  try {
    const data = await kv.get<T>(KV_SCANS);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setScans<T>(data: T): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(KV_SCANS, data);
  } catch {
    // Silently fail
  }
}
