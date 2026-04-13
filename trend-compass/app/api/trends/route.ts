import { kv } from "@vercel/kv";
import { SEED_TRENDS } from "@/lib/seed-data";

const KV_KEY = "tc-trends";

export async function GET() {
  try {
    const stored = await kv.get<string>(KV_KEY);
    if (stored) return Response.json(JSON.parse(stored as string));
    return Response.json(SEED_TRENDS);
  } catch {
    return Response.json(SEED_TRENDS);
  }
}

export async function POST(req: Request) {
  const trends = await req.json();
  try {
    await kv.set(KV_KEY, JSON.stringify(trends));
    return Response.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
