import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured. Add it to your environment variables.");
  }
  return new Anthropic({ apiKey });
}

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Add it to your environment variables.");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function callAI(
  system: string,
  prompt: string,
  tier: "scan" | "synthesis"
): Promise<{ result: string; model: string }> {
  if (tier === "scan") {
    const model = getGemini().getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent({
      systemInstruction: system,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return { result: result.response.text(), model: "Gemini 2.5 Pro" };
  } else {
    const message = await getAnthropic().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return { result: text, model: "Claude Sonnet 4.6" };
  }
}
