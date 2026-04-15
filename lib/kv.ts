import { createClient } from "@vercel/kv";
import type { VercelKV } from "@vercel/kv";

let client: VercelKV | null = null;

function getClient(): VercelKV | null {
  if (client) return client;

  // Standard @vercel/kv env vars
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    client = createClient({ url, token });
    return client;
  }

  // Some Vercel Redis setups only provide KV_URL or REDIS_URL (REST endpoint)
  // along with KV_REST_API_TOKEN or KV_REST_API_READ_ONLY_TOKEN
  const altUrl = process.env.KV_URL || process.env.REDIS_URL;
  const altToken = process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;

  if (altUrl && altUrl.startsWith("https://") && altToken) {
    client = createClient({ url: altUrl, token: altToken });
    return client;
  }

  return null;
}

const KV_TRENDS = "tc:trends";
const KV_SCANS = "tc:scans";

export async function getTrends<T>(fallback: T): Promise<T> {
  const kv = getClient();
  if (!kv) return fallback;
  try {
    const data = await kv.get<T>(KV_TRENDS);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setTrends<T>(data: T): Promise<void> {
  const kv = getClient();
  if (!kv) return;
  try {
    await kv.set(KV_TRENDS, data);
  } catch {
    // Silently fail — localStorage on client is backup
  }
}

export async function getScans<T>(fallback: T): Promise<T> {
  const kv = getClient();
  if (!kv) return fallback;
  try {
    const data = await kv.get<T>(KV_SCANS);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setScans<T>(data: T): Promise<void> {
  const kv = getClient();
  if (!kv) return;
  try {
    await kv.set(KV_SCANS, data);
  } catch {
    // Silently fail
  }
}
