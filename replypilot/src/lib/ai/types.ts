import { z } from "zod";

export const REPLY_VARIANTS = ["warm", "professional", "short"] as const;
export type ReplyVariant = (typeof REPLY_VARIANTS)[number];

export const SENTIMENTS = ["positive", "neutral", "negative"] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

/** The parts of a business profile that shape a reply. */
export type BusinessVoice = {
  name: string;
  businessType: string;
  tone: string;
  ownerName?: string | null;
  contactDetails?: string | null;
  doRules?: string | null;
  dontRules?: string | null;
};

export type ReviewInput = {
  content: string;
  rating?: number | null;
  reviewerName?: string | null;
};

/** Shape Claude is constrained to return (structured output). */
export const ReplySetSchema = z.object({
  sentiment: z.enum(SENTIMENTS),
  replies: z.object({
    warm: z.string(),
    professional: z.string(),
    short: z.string(),
  }),
});

export type ReplySet = z.infer<typeof ReplySetSchema>;
