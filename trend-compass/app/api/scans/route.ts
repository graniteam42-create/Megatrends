import { kv } from "@vercel/kv";

const KV_KEY = "tc-scans";

export async function GET() {
  try {
    const stored = await kv.get<string>(KV_KEY);
    if (stored) return Response.json(JSON.parse(stored as string));
    return Response.json({});
  } catch {
    return Response.json({});
  }
}

export async function POST(req: Request) {
  const scans = await req.json();
  try {
    await kv.set(KV_KEY, JSON.stringify(scans));
    return Response.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
