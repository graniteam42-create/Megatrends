const PEXELS_KEY = process.env.PEXELS_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  if (!query) {
    return Response.json({ error: "Missing ?q= parameter" }, { status: 400 });
  }

  // If no Pexels API key, return a deterministic Pexels URL based on query hash
  // (uses curated collection endpoint which doesn't need auth)
  if (!PEXELS_KEY) {
    return Response.json({ error: "PEXELS_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY }, next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      return Response.json({ error: `Pexels API error: ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    const photos = (data.photos || []).map((p: { src: { landscape: string; small: string }; photographer: string }) => ({
      url: p.src.landscape,
      thumb: p.src.small,
      credit: p.photographer,
    }));
    return Response.json({ photos });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
