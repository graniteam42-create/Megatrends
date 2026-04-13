import { SEED_TRENDS } from "@/lib/seed-data";

let store: string | null = null;

export async function GET() {
  if (store) {
    return Response.json(JSON.parse(store));
  }
  return Response.json(SEED_TRENDS);
}

export async function POST(req: Request) {
  const trends = await req.json();
  store = JSON.stringify(trends);
  return Response.json({ ok: true });
}
