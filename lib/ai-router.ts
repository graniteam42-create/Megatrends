import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireEnv } from "./env";

function getAnthropic() {
  return new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
}

function getGemini() {
  return new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));
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
    return { result: result.response.text(), model: "gemini-2.5-pro" };
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
    return { result: text, model: "claude-sonnet-4" };
  }
}
