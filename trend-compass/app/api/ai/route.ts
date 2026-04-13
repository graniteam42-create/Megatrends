import { callAI } from "@/lib/ai-router";

export async function POST(req: Request) {
  const { system, prompt, tier = "scan" } = await req.json();
  try {
    const { result, model } = await callAI(system, prompt, tier);
    return Response.json({ result, model });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
