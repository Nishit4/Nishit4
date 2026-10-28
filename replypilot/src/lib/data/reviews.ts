import "server-only";

import { REPLY_VARIANTS, type ReplyVariant, type Sentiment } from "@/lib/ai/types";
import type { SupabaseServerClient } from "@/lib/supabase/server";

export type ReviewWithReplies = {
  id: string;
  content: string;
  reviewerName: string | null;
  rating: number | null;
  sentiment: Sentiment | null;
  createdAt: string;
  replies: { id: string; variant: ReplyVariant; content: string }[];
};

export async function listRecentReviews(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 50,
): Promise<ReviewWithReplies[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, content, reviewer_name, rating, sentiment, created_at, replies (id, variant, content)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map((review) => ({
    id: review.id,
    content: review.content,
    reviewerName: review.reviewer_name,
    rating: review.rating,
    sentiment: review.sentiment as Sentiment | null,
    createdAt: review.created_at,
    replies: review.replies
      .map((reply) => ({ ...reply, variant: reply.variant as ReplyVariant }))
      .sort((a, b) => REPLY_VARIANTS.indexOf(a.variant) - REPLY_VARIANTS.indexOf(b.variant)),
  }));
}
