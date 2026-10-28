# ReplyPilot

AI replies to Google reviews for local businesses. A business owner pastes a
review and gets three replies they can post right away (warm, professional and
short), written in their own voice. Negative reviews always get a sincere
apology and an invitation to sort things out offline.

**Stack:** Next.js 16 (App Router) · Tailwind CSS v4 · Supabase (auth + Postgres)
· Stripe subscriptions · Claude API · Vercel

## Features

- **Email/password sign-up and login** (Supabase Auth, email confirmation supported)
- **Business profile:** name, type, tone of voice (with presets), owner sign-off,
  contact details for unhappy customers, and "always do" / "never do" rules
- **Reply generator:** paste a review (plus optional star rating and reviewer
  name) and get warm / professional / short options with one-click copy
- **Negative-review handling:** 1–2 star reviews, or any review describing a
  complaint, get an apology, no excuses, and an offer to resolve it offline
- **Dashboard history** of every review and its replies, each copyable again
- **Plans:** Free (5 replies/month) and Pro ($39/month, unlimited) via Stripe
  Checkout, with the Stripe Customer Portal for cancel/update card/invoices
- **Public landing page** with a live demo (no login, one free reply per visitor)
  and clear pricing

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the architecture, data
model, security model and the Phase 2 Google Business Profile design.

## Project layout

```
src/app/                 routes: landing, (auth), (app)/dashboard|business|billing,
                         auth/confirm, api/stripe/webhook
src/components/          shared UI + landing-page sections
src/lib/ai/              prompt, output schema and the Claude call
src/lib/billing/         Stripe client, customer creation, subscription sync
src/lib/data/            data access (business, profile, reviews, usage)
src/lib/supabase/        server / admin / proxy clients + DB types
src/proxy.ts             session refresh + route protection
supabase/migrations/     schema, RLS policies and SQL functions
```

## Local development

### Prerequisites

- Node.js 20.9 or newer (22 LTS recommended)
- A Supabase project (the free tier is fine for development)
- A Claude API key from [console.anthropic.com](https://console.anthropic.com)
- A Stripe account in **test mode** and the [Stripe CLI](https://docs.stripe.com/stripe-cli)
  (only needed to test billing)

### 1. Install

```bash
cd replypilot
npm install
cp .env.example .env.local
```

### 2. Database

Apply [`supabase/migrations/20261028000000_init.sql`](supabase/migrations/20261028000000_init.sql)
to your project, either way:

- **Dashboard:** open *SQL Editor*, paste the file's contents and run it, or
- **CLI:**
  ```bash
  npx supabase login
  npx supabase link --project-ref <your-project-ref>
  npx supabase db push
  ```

Then fill in the three Supabase variables in `.env.local` from
*Project Settings → API Keys*.

### 3. Auth settings (Supabase dashboard)

- *Authentication → URL Configuration*: set **Site URL** to `http://localhost:3000`
  and add `http://localhost:3000/auth/confirm` to **Redirect URLs**.
- *Authentication → Emails → Confirm signup*: so confirmation links work even
  when opened on a different device, change the link in the template to:
  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/business">Confirm your email</a>
  ```
  (The default template also works, via the PKCE `code` flow, as long as the
  link is opened in the same browser you signed up in.)
- Optional for faster local testing: turn off *Confirm email* under
  *Authentication → Sign In / Providers → Email*.

### 4. Claude API

Set `ANTHROPIC_API_KEY` in `.env.local`. Every generation is a paid API call, so
consider setting a monthly spend limit in the Anthropic Console.

### 5. Stripe (test mode)

1. *Product catalog → Add product*: "ReplyPilot Pro", **recurring, $39.00 USD
   per month**. Copy the price ID (`price_...`) into `STRIPE_PRO_PRICE_ID`.
2. Copy your test secret key into `STRIPE_SECRET_KEY`.
3. *Settings → Billing → Customer portal*: activate the portal and allow
   customers to cancel subscriptions and update payment methods.
4. Forward webhooks to your machine and copy the printed `whsec_...` secret into
   `STRIPE_WEBHOOK_SECRET`:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
5. Pay with test card `4242 4242 4242 4242`, any future expiry date and any CVC.

### 6. Demo protection

Set `DEMO_IP_SALT` to a random secret (`openssl rand -hex 32`).
`DEMO_DAILY_LIMIT` caps demo generations across all visitors per 24 hours.

### 7. Run

```bash
npm run dev        # http://localhost:3000
```

| Script              | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Development server                                 |
| `npm run build`     | Production build                                   |
| `npm start`         | Serve the production build                         |
| `npm test`          | Unit tests (Vitest; Claude and Stripe are mocked)  |
| `npm run lint`      | ESLint                                             |
| `npm run typecheck` | Generate route types and run the TypeScript checker |

## Deploying to Vercel

> The app lives in the `replypilot/` folder of this repository, so set Vercel's
> **Root Directory** to `replypilot`.

1. **Supabase (production project)**
   - Create a project (or reuse yours) and apply the migration as above.
   - *Authentication → URL Configuration*: set **Site URL** to your production URL
     (e.g. `https://replypilot.app`) and add `https://replypilot.app/auth/confirm`
     to **Redirect URLs**.
   - Update the *Confirm signup* email template as in step 3 above.
   - Set up custom SMTP (*Authentication → Emails → SMTP Settings*). Supabase's
     built-in email sender is heavily rate-limited and meant for testing only.

2. **Stripe (live mode)**
   - Recreate the "ReplyPilot Pro" product and $39/month price in live mode and
     copy the live price ID.
   - Activate the Customer Portal in live mode.
   - *Developers → Webhooks → Add endpoint*: URL
     `https://<your-domain>/api/stripe/webhook`, with these events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `customer.subscription.paused`
     - `customer.subscription.resumed`

     Copy the endpoint's signing secret.

3. **Anthropic:** create a production API key and set a spend limit.

4. **Vercel**
   - *Add New → Project*, import this GitHub repository.
   - **Root Directory:** `replypilot` (the framework is detected as Next.js).
   - Add every variable from `.env.example` with production values.
     `NEXT_PUBLIC_SITE_URL` must be your production URL.
   - Deploy, then add your custom domain under *Settings → Domains*.
   - `NEXT_PUBLIC_*` values are baked in at build time. If you change one,
     redeploy.

5. **Smoke test after deploying**
   - Sign up, confirm the email, fill in the business profile, generate replies.
   - Run the landing-page demo once from a private window.
   - Upgrade with a real card (then refund it from Stripe), check that `/billing`
     shows Pro, cancel via *Manage subscription*, and confirm Stripe's webhook
     log shows `200` responses.

### Running costs to expect

- **Vercel:** the Hobby plan is for non-commercial use only, so a paid SaaS
  needs Vercel Pro.
- **Supabase:** free projects pause after a period of inactivity. Use a paid
  plan for production.
- **Stripe:** no monthly fee, just a fee per transaction.
- **Claude API:** pay per token. Each generation sends roughly 1K input tokens
  and returns a few hundred output tokens. That's a few cents per review with
  the default model; check real usage in the Anthropic Console. The model and
  effort level are set in `src/lib/ai/config.ts`, and you can override the
  model with `ANTHROPIC_MODEL`.

## How it works (short version)

- **Reply generation** (`src/lib/ai`): the business profile becomes the system
  prompt. The review goes in the user turn inside `<review>` tags and is treated
  as untrusted data. Claude returns JSON constrained to
  `{ sentiment, replies: { warm, professional, short } }`. If Claude's safety
  classifiers decline a benign review, server-side fallback retries it
  automatically.
- **Quota:** `consume_reply_credit` atomically counts each generation per
  calendar month (UTC). Free = 5, Pro = unlimited. A failed generation is
  refunded.
- **Billing:** the webhook re-fetches the subscription from Stripe and stores
  `plan`, status and period end on the profile. `active`, `trialing` and
  `past_due` count as Pro.
- **Security:** RLS on every table. The service-role key is only used
  server-side for quota counters, billing fields and the demo log. Every Server
  Action re-verifies the session.

## Troubleshooting

- **"Free demo used" while developing:** clear the `rp_demo_used` cookie and run
  `delete from public.demo_usage;` in the SQL editor.
- **Pro doesn't switch on after checkout:** check that `stripe listen` (local)
  or the webhook endpoint (production) is delivering events with `200`
  responses, and that `STRIPE_WEBHOOK_SECRET` matches that endpoint.
- **"Reply generation isn't available right now":** the Claude API rejected the
  request (bad API key, or a model your key can't access). The server logs
  have the details.
- **Confirmation link says it expired:** make sure the Site URL / Redirect URLs
  in Supabase match `NEXT_PUBLIC_SITE_URL`.

## Roadmap

Phase 2: Google Business Profile integration (OAuth, automatic review sync, an
approval queue, one-click publishing and email alerts for new reviews). The
design is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#phase-2-google-business-profile-integration-designed-not-built).
