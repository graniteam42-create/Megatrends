export async function GET() {
  return Response.json({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? `set (${process.env.ANTHROPIC_API_KEY.slice(0, 8)}...)` : "NOT SET",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `set (${process.env.GEMINI_API_KEY.slice(0, 8)}...)` : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
