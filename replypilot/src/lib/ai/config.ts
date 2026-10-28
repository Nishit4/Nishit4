import type Anthropic from "@anthropic-ai/sdk";

type AiConfig = {
  model: string;
  effort: NonNullable<Anthropic.Beta.Messages.BetaOutputConfig["effort"]>;
  maxTokens: number;
  timeoutMs: number;
  maxRetries: number;
};

// One place to tune quality vs. latency vs. cost for every generation.
export const AI_CONFIG: AiConfig = {
  // Override with ANTHROPIC_MODEL to try a different model without a code change.
  model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
  // Review replies are short and latency-sensitive (the user is waiting on
  // screen), so "low" keeps responses fast. Raise to "medium" if quality lags.
  effort: "low",
  maxTokens: 16000,
  // Per-attempt request timeout and SDK retries (429/5xx/network errors).
  timeoutMs: 60_000,
  maxRetries: 1,
};

// Google caps review text at 4,096 characters.
export const REVIEW_MAX_CHARS = 4000;
// Tighter cap for the anonymous landing-page demo.
export const DEMO_REVIEW_MAX_CHARS = 1500;
