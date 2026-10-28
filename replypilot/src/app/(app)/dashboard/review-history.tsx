import { ReplyOptions, SentimentBadge, Stars } from "@/components/reply-options";
import { Card } from "@/components/ui";
import type { ReviewWithReplies } from "@/lib/data/reviews";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function ReviewHistory({ reviews }: { reviews: ReviewWithReplies[] }) {
  if (reviews.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="font-medium text-slate-900">No reviews answered yet</p>
        <p className="mt-1 text-sm text-slate-600">
          Replies you generate are saved here so you can copy them again later.
        </p>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li key={review.id}>
          <Card className="overflow-hidden">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-start gap-4 p-4 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <time dateTime={review.createdAt}>{dateFormat.format(new Date(review.createdAt))}</time>
                    {review.reviewerName && <span>· {review.reviewerName}</span>}
                    {review.rating && <Stars rating={review.rating} />}
                    {review.sentiment && <SentimentBadge sentiment={review.sentiment} />}
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-800 group-open:line-clamp-none">
                    {review.content}
                  </p>
                </div>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="mt-1 size-5 shrink-0 text-slate-400 transition group-open:rotate-180"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </summary>
              <div className="border-t border-slate-100 p-4">
                <ReplyOptions replies={review.replies} />
              </div>
            </details>
          </Card>
        </li>
      ))}
    </ul>
  );
}
