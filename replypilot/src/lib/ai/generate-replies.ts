import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

import { AI_CONFIG } from "./config";
import {
  buildReviewMessage,
  buildSystemPrompt,
  finalizeReplies,
  type GeneratedReplies,
} from "./prompt";
import { ReplySetSchema, type BusinessVoice, type ReviewInput } from "./types";

export type GenerationErrorCode =
  | "refused"
  | "invalid_output"
  | "unavailable"
  | "misconfigured";

const USER_MESSAGES: Record<GenerationErrorCode, string> = {
  refused:
    "We couldn't write a reply for this review. Try removing anything unusual from the text and generate again.",
  invalid_output: "Something went wrong while writing your replies. Please try again.",
  unavailable: "Our reply writer is busy right now. Please try again in a minute.",
  misconfigured: "Reply generation isn't available right now. Please contact support.",
};

/** A failure that's safe to show to the user via `.message`. */
export class ReplyGenerationError extends Error {
  readonly code: GenerationErrorCode;

  constructor(code: GenerationErrorCode, options?: { cause?: unknown }) {
    super(USER_MESSAGES[code], options);
    this.name = "ReplyGenerationError";
    this.code = code;
  }
}

let client: Anthropic | undefined;

function getClient(): Anthropic {
  // Reads ANTHROPIC_API_KEY from the environment.
  client ??= new Anthropic({
    timeout: AI_CONFIG.timeoutMs,
    maxRetries: AI_CONFIG.maxRetries,
  });
  return client;
}

const outputFormat = betaZodOutputFormat(ReplySetSchema);

/**
 * Generates warm / professional / short replies to a review in the business's
 * voice. Throws ReplyGenerationError on any failure.
 */
export async function generateReplies(
  business: BusinessVoice,
  review: ReviewInput,
): Promise<GeneratedReplies> {
  let message: Anthropic.Beta.Messages.BetaMessage;

  try {
    message = await getClient().beta.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens,
      // If a safety classifier declines a benign review, retry server-side on
      // Anthropic's recommended fallback model instead of failing the request.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: AI_CONFIG.effort, format: outputFormat },
      system: buildSystemPrompt(business),
      messages: [{ role: "user", content: buildReviewMessage(review) }],
    });
  } catch (error) {
    throw toGenerationError(error);
  }

  if (message.stop_reason === "refusal") {
    console.warn("Reply generation refused", message.stop_details);
    throw new ReplyGenerationError("refused");
  }

  if (message.stop_reason === "max_tokens") {
    console.error("Reply generation hit max_tokens", message.usage);
    throw new ReplyGenerationError("invalid_output");
  }

  const parsed = parseReplySet(finalText(message.content));
  const result = parsed && finalizeReplies(parsed, review.rating);
  if (!result) {
    console.error("Reply generation returned unusable output", message.id);
    throw new ReplyGenerationError("invalid_output");
  }

  return result;
}

/**
 * The text produced by the model that finished the turn. With server-side
 * fallback, a `fallback` block marks where a declining model's output ends.
 */
function finalText(content: Anthropic.Beta.Messages.BetaContentBlock[]): string {
  const lastFallback = content.findLastIndex((block) => block.type === "fallback");
  return content
    .slice(lastFallback + 1)
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function parseReplySet(text: string) {
  try {
    const result = ReplySetSchema.safeParse(JSON.parse(text));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function toGenerationError(error: unknown): ReplyGenerationError {
  if (
    error instanceof Anthropic.AuthenticationError ||
    error instanceof Anthropic.PermissionDeniedError ||
    error instanceof Anthropic.NotFoundError ||
    error instanceof Anthropic.BadRequestError
  ) {
    // Bad key, unknown model or an invalid request: a deployment problem.
    console.error("Claude API configuration error", error);
    return new ReplyGenerationError("misconfigured", { cause: error });
  }

  if (error instanceof Anthropic.APIError) {
    // Rate limits, overload, 5xx, timeouts and network failures (after SDK
    // retries). APIConnectionError is a subclass of APIError.
    console.error("Claude API unavailable", error);
    return new ReplyGenerationError("unavailable", { cause: error });
  }

  console.error("Unexpected reply generation error", error);
  return new ReplyGenerationError("unavailable", { cause: error });
}
