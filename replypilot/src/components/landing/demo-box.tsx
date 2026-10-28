"use client";

import Link from "next/link";
import { useActionState, useState, useTransition, type FormEvent } from "react";

import { runDemo, type DemoState } from "@/app/demo-actions";
import { ReplyOptions, repliesToList, SentimentBadge } from "@/components/reply-options";
import { Alert, Button, buttonClass, Card, Field, inputClass } from "@/components/ui";
import { DEMO_REVIEW_MAX_CHARS } from "@/lib/ai/config";

const SAMPLES = [
  {
    label: "Try a 5-star review",
    rating: "5",
    content:
      "Stopped in for breakfast on Saturday and the cinnamon rolls were incredible. The staff were so friendly even though it was packed. We'll definitely be back!",
  },
  {
    label: "Try a 2-star review",
    rating: "2",
    content:
      "Waited 40 minutes for a table even though we had a reservation, and my pasta came out cold. Our server was nice but clearly overwhelmed. Disappointing for the price.",
  },
];

export function DemoBox() {
  const [state, formAction, pending] = useActionState<DemoState, FormData>(runDemo, {
    status: "idle",
  });
  const [, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [rating, setRating] = useState("");
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const used = state.status === "error" && state.used;
  const done = used || state.status === "success";

  // Submitting manually (instead of <form action>) skips React's automatic
  // form reset, so the review stays visible next to its replies.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="space-y-4 border-b border-slate-200 p-6 lg:col-span-2 lg:border-r lg:border-b-0">
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setContent(sample.content);
                  setRating(sample.rating);
                }}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <Field label="Paste a Google review" htmlFor="demo-content" error={errors.content}>
            <textarea
              id="demo-content"
              name="content"
              rows={6}
              required
              maxLength={DEMO_REVIEW_MAX_CHARS}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="“Great coffee, but the music was way too loud…”"
              aria-invalid={Boolean(errors.content)}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Business name" htmlFor="demo-name" optional error={errors.businessName}>
              <input id="demo-name" name="businessName" maxLength={120} placeholder="Rosa's Café" className={inputClass} />
            </Field>
            <Field label="Rating" htmlFor="demo-rating" optional>
              <select
                id="demo-rating"
                name="rating"
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                className={inputClass}
              >
                <option value="">Not sure</option>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <option key={stars} value={stars}>
                    {stars} star{stars > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Button type="submit" disabled={pending || done} className="w-full">
            {pending ? "Writing your replies…" : done ? "Free demo used" : "Write my replies, free"}
          </Button>
          <p className="text-center text-xs text-slate-500">One free demo reply, no signup needed.</p>
        </form>

        <div className="bg-slate-50/70 p-6 lg:col-span-3" aria-live="polite">
          {state.status === "success" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-semibold text-slate-900">Three replies, ready to post</p>
                <SentimentBadge sentiment={state.result.sentiment} />
              </div>
              <ReplyOptions replies={repliesToList(state.result.replies)} />
              <div className="flex flex-col items-start gap-3 rounded-xl bg-indigo-600 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm">
                  Like these? Save your tone of voice and get 5 free replies every month.
                </p>
                <Link href="/signup" className={buttonClass("secondary", "shrink-0")}>
                  Create free account
                </Link>
              </div>
            </div>
          ) : state.status === "error" && state.message ? (
            <div className="flex h-full flex-col items-start justify-center gap-4">
              <Alert tone={used ? "info" : "error"}>{state.message}</Alert>
              {used && (
                <Link href="/signup" className={buttonClass("primary")}>
                  Create free account
                </Link>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6" aria-hidden="true">
                  <path d="M8 10h8M8 14h5m-7 6 2.5-3H18a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h0v3Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mt-4 font-medium text-slate-900">
                {pending ? "Reading the review and drafting replies…" : "Your replies will appear here"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                You&apos;ll get a warm, a professional and a short version. Negative reviews get an apology and an
                offer to make it right.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
