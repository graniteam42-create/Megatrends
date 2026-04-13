import { fetchAllPrices } from "@/lib/eodhd";

export async function GET() {
  try {
    const prices = await fetchAllPrices();
    return Response.json(prices);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
