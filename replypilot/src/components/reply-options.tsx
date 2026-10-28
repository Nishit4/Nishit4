import type { ReplyVariant, Sentiment } from "@/lib/ai/types";
import { CopyButton } from "./copy-button";

const VARIANT_LABELS: Record<ReplyVariant, { title: string; description: string }> = {
  warm: { title: "Warm", description: "Friendly and personal" },
  professional: { title: "Professional", description: "Polished and courteous" },
  short: { title: "Short", description: "Quick and to the point" },
};

export function ReplyOptions({
  replies,
}: {
  replies: { variant: ReplyVariant; content: string }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {replies.map((reply) => (
        <div
          key={reply.variant}
          className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-4"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {VARIANT_LABELS[reply.variant].title}
              </p>
              <p className="text-xs text-slate-500">{VARIANT_LABELS[reply.variant].description}</p>
            </div>
            <CopyButton text={reply.content} />
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {reply.content}
          </p>
        </div>
      ))}
    </div>
  );
}

const SENTIMENT_STYLES: Record<Sentiment, string> = {
  positive: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/20",
  negative: "bg-red-50 text-red-700 ring-red-600/20",
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${SENTIMENT_STYLES[sentiment]}`}
    >
      {sentiment}
    </span>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-slate-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

/** Converts the generator's { warm, professional, short } object into a list. */
export function repliesToList(replies: Record<ReplyVariant, string>) {
  return (Object.keys(VARIANT_LABELS) as ReplyVariant[]).map((variant) => ({
    variant,
    content: replies[variant],
  }));
}
