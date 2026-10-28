"use server";

import { cookies, headers } from "next/headers";

import { generateReplies, ReplyGenerationError } from "@/lib/ai/generate-replies";
import type { GeneratedReplies } from "@/lib/ai/prompt";
import {
  claimDemoSlot,
  clientIp,
  DEMO_COOKIE,
  demoBusinessVoice,
  hashIp,
  releaseDemoSlot,
} from "@/lib/demo";
import { demoSchema, fieldErrors, formToObject, type FieldErrors } from "@/lib/validation";

export type DemoState =
  | { status: "idle" }
  | { status: "error"; message?: string; fieldErrors?: FieldErrors; used?: boolean }
  | { status: "success"; result: GeneratedReplies };

const USED_MESSAGE =
  "You've already used your free demo reply. Create a free account to get 5 replies every month.";

export async function runDemo(_prev: DemoState, formData: FormData): Promise<DemoState> {
  const parsed = demoSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  }

  const cookieStore = await cookies();
  if (cookieStore.get(DEMO_COOKIE)) {
    return { status: "error", used: true, message: USED_MESSAGE };
  }

  const markUsed = () =>
    cookieStore.set(DEMO_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

  let ipHash: string;
  try {
    ipHash = hashIp(clientIp(await headers()));
    const slot = await claimDemoSlot(ipHash);

    if (slot === "already_used") {
      markUsed();
      return { status: "error", used: true, message: USED_MESSAGE };
    }
    if (slot === "daily_limit") {
      return {
        status: "error",
        used: true,
        message: "The live demo is taking a break after a busy day. Create a free account to try ReplyPilot now.",
      };
    }
  } catch (error) {
    console.error("Demo slot check failed", error);
    return { status: "error", message: "The demo isn't available right now. Please try again later." };
  }

  try {
    const result = await generateReplies(demoBusinessVoice(parsed.data), parsed.data);
    markUsed();
    return { status: "success", result };
  } catch (error) {
    await releaseDemoSlot(ipHash);
    return {
      status: "error",
      message:
        error instanceof ReplyGenerationError ? error.message : "Something went wrong. Please try again.",
    };
  }
}
