import { env } from "../config/env";
import type { LLMProvider } from "./types";
import { MockProvider } from "./mock";
import { GeminiProvider } from "./gemini";

let cached: LLMProvider | null = null;

/** Resolve the configured LLM provider (LLM_PROVIDER env). */
export function getProvider(): LLMProvider {
  if (cached) return cached;
  switch (env.llmProvider) {
    case "gemini":
      cached = new GeminiProvider();
      break;
    case "mock":
    default:
      cached = new MockProvider();
      break;
  }
  console.log(`[ai] provider: ${cached.name}`);
  return cached;
}

export type { LLMProvider, PaperRequest } from "./types";
