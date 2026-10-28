"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ReplyOptions, repliesToList, SentimentBadge } from "@/components/reply-options";
import { Alert, Button, buttonClass, Card, Field, inputClass } from "@/components/ui";
import { REVIEW_MAX_CHARS } from "@/lib/ai/config";
import { generateRepliesAction, type GenerateState } from "./actions";

export function GeneratorForm({ limitReached }: { limitReached: boolean }) {
  const [state, formAction, pending] = useActionState<GenerateState, FormData>(
    generateRepliesAction,
    { status: "idle" },
  );

  const values = state.status === "error" ? state.values : {};
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const showUpgrade = limitReached || (state.status === "error" && state.limitReached);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        {showUpgrade ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">You&apos;ve used this month&apos;s free replies</p>
              <p className="mt-1 text-sm text-slate-600">
                Upgrade to Pro for unlimited replies, or wait until your free replies reset next month.
              </p>
            </div>
            <Link href="/billing" className={buttonClass("primary")}>
              Upgrade to Pro
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            {state.status === "error" && state.message && (
              <Alert tone="error">{state.message}</Alert>
            )}

            <Field label="Review" htmlFor="content" error={errors.content}>
              <textarea
                id="content"
                name="content"
                rows={6}
                required
                maxLength={REVIEW_MAX_CHARS}
                defaultValue={values.content}
                placeholder="Paste the customer's review here…"
                aria-invalid={Boolean(errors.content)}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Star rating" htmlFor="rating" optional error={errors.rating}>
                <select
                  id="rating"
                  name="rating"
                  defaultValue={values.rating ?? ""}
                  className={inputClass}
                >
                  <option value="">Not sure</option>
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <option key={stars} value={stars}>
                      {"★".repeat(stars)} ({stars} star{stars > 1 ? "s" : ""})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reviewer name" htmlFor="reviewerName" optional error={errors.reviewerName}>
                <input
                  id="reviewerName"
                  name="reviewerName"
                  maxLength={120}
                  defaultValue={values.reviewerName}
                  placeholder="e.g. Jamie R."
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                1–2 star reviews always get an apology and an offer to sort it out offline.
              </p>
              <Button type="submit" disabled={pending}>
                {pending ? "Writing replies…" : "Generate replies"}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {state.status === "success" && (
        <Card className="space-y-4 p-6" aria-live="polite">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-semibold text-slate-900">Your replies</h2>
            <SentimentBadge sentiment={state.result.sentiment} />
            {state.result.sentiment === "negative" && (
              <span className="text-xs text-slate-500">
                Includes an apology and an invitation to resolve it offline.
              </span>
            )}
          </div>
          <blockquote className="line-clamp-3 border-l-2 border-slate-200 pl-3 text-sm italic text-slate-600">
            {state.review}
          </blockquote>
          <ReplyOptions replies={repliesToList(state.result.replies)} />
        </Card>
      )}
    </div>
  );
}
