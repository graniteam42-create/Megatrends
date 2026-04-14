import { kv } from "@vercel/kv";

const VISITS_KEY = "app_visits";
const MAX_VISITS = 500;

export interface Visit {
  ts: string;
  city: string;
  country: string;
  region: string;
  lat: number | null;
  lng: number | null;
  ua: string;
}

export async function POST(req: Request) {
  try {
    const city = req.headers.get("x-vercel-ip-city") || "Unknown";
    const country = req.headers.get("x-vercel-ip-country") || "Unknown";
    const region = req.headers.get("x-vercel-ip-country-region") || "";
    const lat = req.headers.get("x-vercel-ip-latitude");
    const lng = req.headers.get("x-vercel-ip-longitude");
    const ua = req.headers.get("user-agent") || "";

    const visit: Visit = {
      ts: new Date().toISOString(),
      city: decodeURIComponent(city),
      country,
      region,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      ua: ua.slice(0, 200),
    };

    await kv.lpush(VISITS_KEY, JSON.stringify(visit));
    await kv.ltrim(VISITS_KEY, 0, MAX_VISITS - 1);

    return Response.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const raw = await kv.lrange(VISITS_KEY, 0, MAX_VISITS - 1);
    const visits: Visit[] = raw.map((r) => {
      if (typeof r === "string") return JSON.parse(r);
      return r;
    });
    return Response.json({ visits });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ visits: [], error: message });
  }
}
