import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

import { createLovableAiGatewayRunIdFetch } from "./ai/run-id.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export type SummaryLength = "short" | "medium" | "detailed";

const LENGTH_PROMPTS: Record<SummaryLength, string> = {
  short:
    "a very tight summary of 2-3 sentences. Keep it to roughly 10% of the original length, and never longer than the original.",
  medium:
    "a clear summary of roughly 25% of the original length, condensing each main point. Never longer than the original.",
  detailed:
    "a thorough summary of roughly 45% of the original length, preserving key details. Never longer than the original.",
};

export async function generateSummary(
  text: string,
  length: SummaryLength,
  abortSignal?: AbortSignal,
): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    throw new Error("The AI service is not configured. Please try again later.");
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    ...(abortSignal ? { abortSignal } : {}),
    instructions: [
      "You are Squish, an expert text summarizer. Summarize the user's text faithfully and neutrally, keeping the original meaning, names, and key numbers.",
      "Do not invent information. Do not add commentary, preamble, or markdown headings — respond with the summary prose only.",
      `Produce ${LENGTH_PROMPTS[length]}.`,
    ].join(" "),
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
    messages: [{ role: "user", content: `Summarize the following text:\n\n${text}` }],
  });

  const summary = await result.text;
  if (!summary.trim()) {
    throw new Error("The summary came back empty. Please try again.");
  }
  return summary.trim();
}
