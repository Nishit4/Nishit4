# ReplyPilot architecture

ReplyPilot helps local businesses answer Google reviews. A business owner pastes a
review and gets three ready-to-post replies (warm, professional, short) written in
their own voice. Negative reviews always get an apology and an invitation to
resolve the issue offline.

## Stack

| Concern        | Choice                                                         |
| -------------- | -------------------------------------------------------------- |
| Web framework  | Next.js 16 (App Router, Server Components, Server Actions)     |
| Styling        | Tailwind CSS v4                                                |
| Auth + DB      | Supabase (email/password auth, Postgres with Row Level Security) |
| Payments       | Stripe Checkout + Customer Portal + webhooks                   |
| AI             | Claude API via `@anthropic-ai/sdk` (structured JSON output)    |
| Hosting        | Vercel                                                         |

## High-level picture

```
Browser ──► Next.js on Vercel
             │
             ├─ proxy.ts ............ refreshes the Supabase session cookie,
             │                        gates /dashboard, /business, /billing
             │
             ├─ Server Components ... read data with the *user's* Supabase client
             │                        (RLS enforces "only my rows")
             │
             ├─ Server Actions ...... login/signup, save business profile,
             │                        generate replies, demo, start checkout/portal
             │
             └─ /api/stripe/webhook . Stripe → us; syncs subscription state
                                       with the *service-role* client

Server-only modules:
  lib/ai/*        → Claude API (the only place the Anthropic key is used)
  lib/supabase/admin.ts → service-role client (quota counters, billing fields, demo log)
  lib/billing/*   → Stripe SDK, customer creation, subscription sync
```

## Directory layout

```
src/
  proxy.ts                     session refresh + route protection
  app/
    page.tsx                   public landing page (hero, live demo, pricing, FAQ)
    demo-actions.ts            Server Action behind the landing-page demo
    (auth)/                    login + signup pages and their Server Actions
    auth/confirm/route.ts      email-confirmation link handler
    (app)/                     authenticated area (shared nav)
      dashboard/               generator + history
      business/                business profile (onboarding + edit)
      billing/                 plan, usage, upgrade / manage subscription
    api/stripe/webhook/        Stripe webhook endpoint
  components/                  shared UI; landing/ holds the marketing sections
  lib/
    ai/                        prompt building, output schema, Claude call
    supabase/                  server/admin clients, proxy helper, DB types
    data/                      data-access functions (business, profile, reviews, usage)
    billing/                   Stripe client, customer + subscription sync
    auth.ts                    current-user helpers (Data Access Layer)
    plans.ts                   plan catalogue (single source of truth for limits)
    demo.ts                    demo abuse protection (IP hashing, slots)
    env.ts, validation.ts      typed env access, zod form schemas
supabase/migrations/           SQL schema, RLS policies, RPC functions
```

## Core flows

### 1. Generate replies (signed-in user)

1. The dashboard form posts to the `generateRepliesAction` Server Action.
2. The action re-checks the session, loads the user's business profile and plan.
3. `consume_reply_credit(user, limit)` atomically increments this month's counter
   and refuses if the free limit is reached (Pro passes `null` = unlimited).
4. `lib/ai/generate-replies.ts` calls Claude with the business profile in the
   system prompt and the review (as untrusted data) in the user turn. The response
   is constrained to a JSON schema: `{ sentiment, replies: { warm, professional, short } }`.
5. If the rating is 1–2 stars or Claude classifies the review as negative, the
   prompt's negative-review rules apply (apology, no excuses, offline contact).
6. `record_generation(...)` stores the review and its three replies in one
   transaction. If Claude fails, the credit is refunded.
7. The page re-renders; the new review appears at the top of the history with
   copy buttons on each reply.

**Quota unit:** one "reply" = one generation (one review → three options).
Counters are per calendar month (UTC) in `usage_counters`.

### 2. Landing-page demo (no login)

1. The demo form posts to the `runDemo` Server Action with a review and an
   optional business name/type.
2. Abuse protection, cheapest check first:
   - a `rp_demo_used` cookie,
   - `claim_demo_slot(ip_hash, daily_cap)`: one demo per hashed IP, plus a global
     24-hour cap (`DEMO_DAILY_LIMIT`) so a bot can't run up the Claude bill,
   - a hard character limit on the review.
3. Same generator as the app, with a generic "friendly local business" profile.
4. On failure the slot is released so the visitor can retry.

IP addresses are never stored in plain text. They are hashed with SHA-256 using
`DEMO_IP_SALT`.

### 3. Billing

1. `/billing` → "Upgrade to Pro" runs the `startCheckout` Server Action, which
   creates (or reuses) a Stripe customer, saves `stripe_customer_id` on the
   profile, and redirects to Stripe Checkout (subscription mode, `STRIPE_PRO_PRICE_ID`).
2. Stripe sends `checkout.session.completed` and `customer.subscription.*` events
   to `/api/stripe/webhook`. The signature is verified, then the handler
   **re-fetches the subscription from Stripe** and writes `plan`,
   `subscription_status`, `current_period_end` and `cancel_at_period_end` to the
   profile. Re-fetching makes the handler idempotent and safe against
   out-of-order delivery.
3. `plan = 'pro'` while the subscription is `active`, `trialing` or `past_due`
   (a grace period while Stripe retries a failed card). Anything else falls back
   to `free`. Late events for a subscription that has since been replaced are
   ignored, so they can't downgrade someone who re-subscribed.
4. "Manage subscription" opens the Stripe Customer Portal (cancel, update card,
   invoices).

## Data model

```
auth.users (Supabase)
   │ 1:1
profiles ─────────── plan, stripe_customer_id, stripe_subscription_id,
   │                 subscription_status, current_period_end, cancel_at_period_end
   │ 1:1 (MVP)
businesses ───────── name, business_type, tone, owner_name, contact_details,
   │                 do_rules, dont_rules
   │ 1:n
reviews ──────────── source (manual|google), external_id, reviewer_name, rating,
   │                 content, sentiment, status (draft|pending_approval|approved|
   │                 published|dismissed)
   │ 1:n
replies ──────────── variant (warm|professional|short), content, is_selected

usage_counters ───── (user_id, period_start) → generations
demo_usage ───────── ip_hash, created_at          (service role only)
```

`source`, `external_id` and the approval statuses on `reviews` aren't used by
the MVP yet. They're there so Phase 2 doesn't need a breaking migration.

## Security model

- **Row Level Security everywhere.** Pages and actions use the signed-in
  user's Supabase client, and policies limit every table to `auth.uid()`.
  Users can read their own profile but can't write billing fields.
- **Service-role key** is used only in server-only modules: quota counters,
  webhook profile updates and the demo log. The RPCs it calls are
  `revoke`d from `anon` and `authenticated`.
- **Every Server Action re-verifies the session.** It never trusts a user id
  sent by the client.
- **Prompt injection:** the review text goes inside `<review>` tags. The system
  prompt says to treat it as data and never follow instructions found in it. The
  output is schema-constrained JSON, so the model can only return reply text.
- **Stripe webhooks** are verified with `STRIPE_WEBHOOK_SECRET` on the raw body.
- **Cost controls:** input length caps, free-tier quota, a demo cap per IP and per
  day, and a single server-side model/effort setting in `lib/ai/config.ts`.

## Phase 2: Google Business Profile integration (designed, not built)

1. **Connect:** Google OAuth with the `business.manage` scope. Store the refresh
   token encrypted in a new `google_connections` table (user_id, account_id,
   location_id, encrypted_refresh_token). Note: Google gates the Business Profile
   APIs behind an access request, so apply early.
2. **Sync:** a Vercel Cron job (every 15–30 min) lists new reviews per location
   (`accounts.locations.reviews.list`). It upserts them into `reviews` with
   `source='google'`, `external_id=<review id>` and `status='pending_approval'`
   (unique on `(business_id, external_id)`), then generates drafts automatically.
3. **Approval queue:** a `/queue` page lists `pending_approval` reviews with the
   three drafts. The owner edits/picks one (`replies.is_selected`) and approves.
   Approving calls `reviews.updateReply` and marks the review `published`.
4. **Notifications:** an email (e.g. Resend) when new reviews arrive. Negative
   reviews get an immediate email; positive ones go in a daily digest.
   Preferences live in a `notification_settings` table.
5. **Plans:** Phase 2 is a natural Pro-only feature, or a higher tier. Auto-sync
   counts against the same quota.
