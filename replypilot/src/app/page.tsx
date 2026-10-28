import Link from "next/link";

import { DemoBox } from "@/components/landing/demo-box";
import { Faq } from "@/components/landing/faq";
import { Pricing } from "@/components/landing/pricing";
import { SiteHeader } from "@/components/landing/site-header";
import { Logo } from "@/components/logo";
import { Stars } from "@/components/reply-options";
import { buttonClass } from "@/components/ui";

const STEPS = [
  {
    title: "Set up your voice",
    body: "Tell us your business type, how you like to talk to customers, who signs the replies and anything you never want said.",
  },
  {
    title: "Paste a review",
    body: "Copy a review from Google and paste it in. Add the star rating if you have it.",
  },
  {
    title: "Pick, copy, post",
    body: "Get warm, professional and short replies in seconds. Copy your favourite with one click and post it on Google.",
  },
];

const FEATURES = [
  {
    title: "Sounds like you, not a robot",
    body: "Replies mention what the customer actually said and follow your tone, so they never read like a template.",
  },
  {
    title: "Handles the tough ones",
    body: "Negative reviews get a calm, sincere apology and an invitation to make it right offline. No excuses, no arguments.",
  },
  {
    title: "Your rules, every time",
    body: "\"Always mention our patio.\" \"Never offer discounts.\" Your do's and don'ts are followed in every reply.",
  },
  {
    title: "History at your fingertips",
    body: "Every review and reply is saved, so you can find and copy a past answer in seconds.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-12 md:pt-24 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                For restaurants, salons, clinics, shops and every local business
              </p>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Reply to every Google review in seconds, in your own voice.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                ReplyPilot writes three thoughtful replies to each review: warm, professional or short. Unhappy
                customers get a sincere apology and an offer to make it right.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#demo" className={buttonClass("primary", "px-5 py-3")}>
                  Try it free, no signup
                </a>
                <Link href="/signup" className={buttonClass("secondary", "px-5 py-3")}>
                  Create free account
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">5 free replies every month · No credit card</p>
            </div>

            <ExampleCard />
          </div>
        </section>

        <section id="demo" className="scroll-mt-20 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Live demo"
              title="See it work on a real review"
              body="Paste any review, or use one of ours. You'll get three ready-to-post replies."
            />
            <div className="mt-10">
              <DemoBox />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 bg-slate-50 px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow="How it works" title="From review to reply in under a minute" />
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <span className="flex size-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div key={feature.title}>
                  <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Pricing"
              title="Simple pricing, no surprises"
              body="Start free. Upgrade when you're answering more than a handful of reviews a month."
            />
            <div className="mt-12">
              <Pricing />
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 bg-slate-50 px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow="FAQ" title="Questions, answered" />
            <div className="mt-10">
              <Faq />
            </div>
          </div>
        </section>

        <section className="px-4 py-20">
          <div className="mx-auto max-w-4xl rounded-3xl bg-indigo-600 px-6 py-14 text-center text-white">
            <h2 className="text-3xl font-semibold tracking-tight">Never leave a review unanswered again</h2>
            <p className="mx-auto mt-4 max-w-xl text-indigo-100">
              Customers notice when you reply, and so does Google. Start with 5 free replies this month.
            </p>
            <Link href="/signup" className={buttonClass("secondary", "mt-8 px-6 py-3")}>
              Get started free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <Logo />
          <p>© ReplyPilot. Made for local businesses.</p>
        </div>
      </footer>
    </>
  );
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-indigo-600">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
      {body && <p className="mt-4 text-slate-600">{body}</p>}
    </div>
  );
}

function ExampleCard() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-indigo-200/40 blur-2xl" aria-hidden="true" />
      <div className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
            M
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">Maria G.</p>
            <Stars rating={2} />
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">
          “Waited 40 minutes for our table even with a reservation, and the pasta came out cold.”
        </p>
        <div className="mt-4 rounded-xl bg-indigo-50 p-4">
          <p className="text-xs font-semibold text-indigo-700">Reply from the owner · written by ReplyPilot</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Maria, I&apos;m truly sorry. A 40-minute wait with a reservation and a cold dish isn&apos;t the
            evening we want for anyone. I&apos;d love to hear more and make it right. Could you email me at
            hello@trattoria.com?
            <br />– Luca, Owner
          </p>
        </div>
      </div>
    </div>
  );
}
