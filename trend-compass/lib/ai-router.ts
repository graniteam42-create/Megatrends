import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function callAI(
  system: string,
  prompt: string,
  tier: "scan" | "synthesis"
): Promise<{ result: string; model: string }> {
  if (tier === "scan") {
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent({
      systemInstruction: system,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return { result: result.response.text(), model: "Gemini 2.5 Pro" };
  } else {
    const message = await anthropic.messages.create({
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
