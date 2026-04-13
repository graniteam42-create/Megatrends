let store: string | null = null;

export async function GET() {
  if (store) {
    return Response.json(JSON.parse(store));
  }
  return Response.json({});
}

export async function POST(req: Request) {
  const scans = await req.json();
  store = JSON.stringify(scans);
  return Response.json({ ok: true });
}
