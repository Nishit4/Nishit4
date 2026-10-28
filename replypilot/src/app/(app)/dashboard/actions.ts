"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { generateReplies, ReplyGenerationError } from "@/lib/ai/generate-replies";
import type { GeneratedReplies } from "@/lib/ai/prompt";
import { requireUser } from "@/lib/auth";
import { getBusiness, toBusinessVoice } from "@/lib/data/business";
import { getProfile } from "@/lib/data/profile";
import { consumeReplyCredit, refundReplyCredit } from "@/lib/data/usage";
import { planFor } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, formToObject, reviewSchema, type FieldErrors } from "@/lib/validation";

export type GenerateState =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      limitReached?: boolean;
      fieldErrors?: FieldErrors;
      values: Record<string, string>;
    }
  | { status: "success"; review: string; result: GeneratedReplies };

export async function generateRepliesAction(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const user = await requireUser();
  const values = formToObject(formData);

  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const [business, profile] = await Promise.all([
    getBusiness(supabase, user.id),
    getProfile(supabase, user.id),
  ]);
  if (!business) redirect("/business");

  const plan = planFor(profile);
  const allowed = await consumeReplyCredit(user.id, plan.monthlyReplyLimit);
  if (!allowed) {
    return {
      status: "error",
      limitReached: true,
      message: `You've used all ${plan.monthlyReplyLimit} free replies this month. Upgrade to Pro for unlimited replies.`,
      values,
    };
  }

  let result: GeneratedReplies;
  try {
    result = await generateReplies(toBusinessVoice(business), parsed.data);
  } catch (error) {
    await refundReplyCredit(user.id);
    return {
      status: "error",
      message:
        error instanceof ReplyGenerationError
          ? error.message
          : "Something went wrong. Please try again.",
      values,
    };
  }

  const { error: saveError } = await supabase.rpc("record_generation", {
    p_business_id: business.id,
    p_content: parsed.data.content,
    p_reviewer_name: parsed.data.reviewerName,
    p_rating: parsed.data.rating,
    p_sentiment: result.sentiment,
    p_replies: Object.entries(result.replies).map(([variant, content]) => ({ variant, content })),
  });
  // The replies are still shown; they just won't appear in history.
  if (saveError) console.error("Failed to save generation", saveError);

  refresh();
  return { status: "success", review: parsed.data.content, result };
}
