import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

// Load root .env (monorepo) first, then a local apps/api/.env if present.
// Existing process.env (e.g. Cloud Run) always wins — dotenv never overrides.
loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv({ path: resolve(process.cwd(), ".env") });

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  mongoUri: required("MONGODB_URI"),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",

  llmProvider: (process.env.LLM_PROVIDER ?? "mock").toLowerCase() as
    | "gemini"
    | "mock",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",

  isProd: process.env.NODE_ENV === "production",
};

export type Env = typeof env;
