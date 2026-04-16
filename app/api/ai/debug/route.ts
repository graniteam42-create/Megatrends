import { hasEnv } from "@/lib/env";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not available in production" }, { status: 404 });
  }
  return Response.json({
    ANTHROPIC_API_KEY: hasEnv("ANTHROPIC_API_KEY") ? "set" : "NOT SET",
    GEMINI_API_KEY: hasEnv("GEMINI_API_KEY") ? "set" : "NOT SET",
    EODHD_API_KEY: hasEnv("EODHD_API_KEY") ? "set" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
