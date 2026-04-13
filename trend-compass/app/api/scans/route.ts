const KV_KEY = "tc-scans";

let memoryStore: string | null = null;

async function getKv() {
  try {
    const { kv } = await import("@vercel/kv");
    return kv;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const kv = await getKv();
    if (kv) {
      const stored = await kv.get<string>(KV_KEY);
      if (stored) return Response.json(JSON.parse(stored as string));
    } else if (memoryStore) {
      return Response.json(JSON.parse(memoryStore));
    }
    return Response.json({});
  } catch {
    return Response.json({});
  }
}

export async function POST(req: Request) {
  const scans = await req.json();
  try {
    const kv = await getKv();
    if (kv) {
      await kv.set(KV_KEY, JSON.stringify(scans));
    } else {
      memoryStore = JSON.stringify(scans);
    }
    return Response.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
