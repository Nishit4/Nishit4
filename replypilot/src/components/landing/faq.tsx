const QUESTIONS = [
  {
    q: "Does ReplyPilot post replies to Google for me?",
    a: "Not yet. Today you paste a review, pick the reply you like and copy it into Google with one click. A direct Google Business Profile connection, with an approval queue and email alerts for new reviews, is next on our roadmap.",
  },
  {
    q: "What counts as a reply on the free plan?",
    a: "Each review you answer counts once, and you always get three versions to choose from. The free plan includes 5 reviews per calendar month and resets on the 1st.",
  },
  {
    q: "How does it handle angry or unfair reviews?",
    a: "Reviews with 1–2 stars, or any review describing a problem, get a sincere apology with no excuses or arguing, plus an invitation to sort it out offline using the contact details you choose.",
  },
  {
    q: "Will the replies sound like me?",
    a: "You set your business type, tone of voice, sign-off name and your own do's and don'ts, such as \"never offer discounts\". Every reply follows them, and replies come back in the same language as the review.",
  },
  {
    q: "Can I cancel Pro at any time?",
    a: "Yes. Manage or cancel your subscription from the billing page whenever you like. You keep Pro until the end of the period you've paid for.",
  },
];

export function Faq() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-slate-200">
      {QUESTIONS.map(({ q, a }) => (
        <details key={q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-900 [&::-webkit-details-marker]:hidden">
            <h3>{q}</h3>
            <span className="text-xl leading-none text-slate-400 transition group-open:rotate-45" aria-hidden="true">
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
        </details>
      ))}
    </div>
  );
}
