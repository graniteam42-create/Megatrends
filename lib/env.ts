// Centralized environment variable access + validation.
// Read env vars through this module so missing/invalid values fail loudly.

import { logger } from "./logger";

type EnvKey =
  | "APP_PASSWORD"
  | "ANTHROPIC_API_KEY"
  | "GEMINI_API_KEY"
  | "EODHD_API_KEY"
  | "FRED_API_KEY"
  | "PEXELS_API_KEY"
  | "REDIS_URL"
  | "KV_URL"
  | "NEXT_PUBLIC_SITE_URL";

// Required at runtime for the app to behave correctly. Missing values log a warning
// but do not throw — many routes gracefully degrade without them.
const RECOMMENDED: EnvKey[] = [
  "APP_PASSWORD",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "EODHD_API_KEY",
];

let warned = false;

function warnMissingOnce() {
  if (warned) return;
  warned = true;
  const missing = RECOMMENDED.filter((k) => !process.env[k]);
  if (missing.length) {
    logger.warn(
      `Missing recommended env vars: ${missing.join(", ")}. ` +
        `Features depending on them will be disabled. See .env.example.`
    );
  }
}

export function getEnv(key: EnvKey): string | undefined {
  warnMissingOnce();
  return process.env[key];
}

export function requireEnv(key: EnvKey): string {
  warnMissingOnce();
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `${key} is not configured. Add it to your environment (see .env.example).`
    );
  }
  return value;
}

export function hasEnv(key: EnvKey): boolean {
  return Boolean(process.env[key]);
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
