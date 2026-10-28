import Anthropic from "@anthropic-ai/sdk";
import { Messages } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateReplies, ReplyGenerationError } from "./generate-replies";
import type { BusinessVoice } from "./types";

type BetaMessage = Anthropic.Beta.Messages.BetaMessage;

const business: BusinessVoice = {
  name: "Rosa's Bakery",
  businessType: "Bakery",
  tone: "Warm",
};

const validJson = JSON.stringify({
  sentiment: "positive",
  replies: { warm: "Thank you, Sam!", professional: "Thank you for your review.", short: "Thanks!" },
});

function fakeMessage(overrides: Partial<BetaMessage>): BetaMessage {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-5-5",
    content: [{ type: "text", text: validJson, citations: null }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 10 },
    ...overrides,
  } as BetaMessage;
}

function mockCreate(result: BetaMessage | Error) {
  // The real method returns an APIPromise; a plain Promise is enough here.
  const impl = () =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
  return vi
    .spyOn(Messages.prototype, "create")
    .mockImplementation(impl as unknown as typeof Messages.prototype.create);
}

beforeAll(() => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.mocked(Messages.prototype.create).mockRestore?.();
});

describe("generateReplies", () => {
  it("sends a structured-output request with fallbacks and returns the replies", async () => {
    const create = mockCreate(fakeMessage({}));

    const result = await generateReplies(business, { content: "Great bread", rating: 5 });

    expect(result).toEqual({
      sentiment: "positive",
      replies: { warm: "Thank you, Sam!", professional: "Thank you for your review.", short: "Thanks!" },
    });

    const params = create.mock.calls[0][0] as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.fallbacks).toBe("default");
    expect(params.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(params.output_config?.effort).toBe("low");
    expect(params.output_config?.format?.type).toBe("json_schema");
    expect(params.system).toContain("Rosa's Bakery");
    expect(params.messages[0].content).toContain("Great bread");
  });

  it("uses the text after the last fallback block", async () => {
    mockCreate(
      fakeMessage({
        content: [
          { type: "text", text: '{"sentiment":"pos', citations: null },
          {
            type: "fallback",
            from: { model: "claude-opus-5-5" },
            to: { model: "claude-opus-4-8" },
          } as unknown as Anthropic.Beta.Messages.BetaContentBlock,
          { type: "text", text: validJson, citations: null },
        ],
      }),
    );

    const result = await generateReplies(business, { content: "Great bread" });
    expect(result.replies.short).toBe("Thanks!");
  });

  it("forces negative sentiment for 1-2 star reviews", async () => {
    mockCreate(fakeMessage({}));
    const result = await generateReplies(business, { content: "Stale", rating: 1 });
    expect(result.sentiment).toBe("negative");
  });

  it("maps a refusal to a friendly error", async () => {
    mockCreate(fakeMessage({ stop_reason: "refusal", content: [] }));
    await expect(generateReplies(business, { content: "x" })).rejects.toMatchObject({
      name: "ReplyGenerationError",
      code: "refused",
    });
  });

  it("rejects truncated or invalid output", async () => {
    mockCreate(fakeMessage({ stop_reason: "max_tokens" }));
    await expect(generateReplies(business, { content: "x" })).rejects.toMatchObject({
      code: "invalid_output",
    });

    mockCreate(fakeMessage({ content: [{ type: "text", text: "not json", citations: null }] }));
    await expect(generateReplies(business, { content: "x" })).rejects.toMatchObject({
      code: "invalid_output",
    });
  });

  it("maps API errors to unavailable / misconfigured", async () => {
    mockCreate(new Anthropic.APIConnectionError({ message: "network down" }));
    const unavailable = await generateReplies(business, { content: "x" }).catch((e) => e);
    expect(unavailable).toBeInstanceOf(ReplyGenerationError);
    expect(unavailable.code).toBe("unavailable");

    mockCreate(
      new Anthropic.AuthenticationError(401, { message: "bad key" }, "bad key", new Headers()),
    );
    const misconfigured = await generateReplies(business, { content: "x" }).catch((e) => e);
    expect(misconfigured.code).toBe("misconfigured");
  });
});
