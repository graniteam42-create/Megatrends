import { fetchAllPrices } from "@/lib/eodhd";

export async function GET() {
  const prices = await fetchAllPrices();
  return new Response(JSON.stringify(prices, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
