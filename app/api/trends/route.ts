import { SEED_TRENDS } from "@/lib/seed-data";
import { getTrends, setTrends } from "@/lib/kv";

// In-memory fallback when KV is not configured
let memStore: string | null = null;

export async function GET() {
  // Try KV first
  const kvData = await getTrends(null);
  if (kvData) return Response.json(kvData);

  // Fall back to in-memory store
  if (memStore) return Response.json(JSON.parse(memStore));

  return Response.json(SEED_TRENDS);
}

export async function POST(req: Request) {
  const trends = await req.json();

  // Persist to KV (survives deploys)
  await setTrends(trends);

  // Also keep in-memory for same-instance reads
  memStore = JSON.stringify(trends);

  return Response.json({ ok: true });
}
