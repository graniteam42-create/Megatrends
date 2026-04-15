import { getScans, setScans } from "@/lib/kv";

// In-memory fallback when KV is not configured
let memStore: string | null = null;

export async function GET() {
  // Try KV first
  const kvData = await getScans(null);
  if (kvData) return Response.json(kvData);

  // Fall back to in-memory store
  if (memStore) return Response.json(JSON.parse(memStore));

  return Response.json({});
}

export async function POST(req: Request) {
  const scans = await req.json();

  // Persist to KV (survives deploys)
  await setScans(scans);

  // Also keep in-memory for same-instance reads
  memStore = JSON.stringify(scans);

  return Response.json({ ok: true });
}
