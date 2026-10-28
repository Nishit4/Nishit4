-- ReplyPilot initial schema.
--
-- Conventions:
--   * Every table has RLS enabled. Signed-in users only ever see their own rows.
--   * Billing fields, usage counters and the demo log are written exclusively by
--     the server with the service-role key (via the security-definer functions
--     at the bottom, which are not executable by anon/authenticated).
--   * Functions pin `search_path = ''` and fully qualify every name.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, holds plan + Stripe state
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- No insert/update/delete policies: rows are created by the trigger below and
-- billing fields are updated by the Stripe webhook using the service role.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- businesses: the profile that shapes every generated reply
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  business_type text not null check (char_length(business_type) between 1 and 80),
  tone text not null check (char_length(tone) between 1 and 300),
  owner_name text check (char_length(owner_name) <= 80),
  contact_details text check (char_length(contact_details) <= 200),
  do_rules text check (char_length(do_rules) <= 2000),
  dont_rules text check (char_length(dont_rules) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MVP: one business per user. Drop this index to support multiple locations.
create unique index businesses_user_id_key on public.businesses (user_id);

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

alter table public.businesses enable row level security;

create policy "businesses: read own"
  on public.businesses for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "businesses: insert own"
  on public.businesses for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "businesses: update own"
  on public.businesses for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "businesses: delete own"
  on public.businesses for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- reviews: pasted reviews today, Google-synced reviews in Phase 2
-- ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  source text not null default 'manual' check (source in ('manual', 'google')),
  external_id text,
  reviewer_name text check (char_length(reviewer_name) <= 120),
  rating smallint check (rating between 1 and 5),
  content text not null check (char_length(content) between 1 and 5000),
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  status text not null default 'draft'
    check (status in ('draft', 'pending_approval', 'approved', 'published', 'dismissed')),
  created_at timestamptz not null default now()
);

create index reviews_user_id_created_at_idx on public.reviews (user_id, created_at desc);
create index reviews_business_id_idx on public.reviews (business_id);
-- Phase 2: de-duplicate reviews pulled from Google.
create unique index reviews_business_external_id_key
  on public.reviews (business_id, external_id)
  where external_id is not null;

alter table public.reviews enable row level security;

create policy "reviews: read own"
  on public.reviews for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "reviews: insert own"
  on public.reviews for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "reviews: update own"
  on public.reviews for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "reviews: delete own"
  on public.reviews for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- replies: the generated options for a review
-- ---------------------------------------------------------------------------

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  variant text not null check (variant in ('warm', 'professional', 'short')),
  content text not null check (char_length(content) between 1 and 5000),
  is_selected boolean not null default false,
  created_at timestamptz not null default now()
);

create index replies_review_id_idx on public.replies (review_id);
create index replies_user_id_idx on public.replies (user_id);

alter table public.replies enable row level security;

create policy "replies: read own"
  on public.replies for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "replies: insert own"
  on public.replies for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.reviews r
      where r.id = review_id and r.user_id = (select auth.uid())
    )
  );

create policy "replies: update own"
  on public.replies for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- usage_counters: generations per user per calendar month (UTC)
-- ---------------------------------------------------------------------------

create table public.usage_counters (
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start date not null,
  generations integer not null default 0 check (generations >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start)
);

alter table public.usage_counters enable row level security;

create policy "usage_counters: read own"
  on public.usage_counters for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- demo_usage: one landing-page demo per (hashed) IP. Service role only.
-- ---------------------------------------------------------------------------

create table public.demo_usage (
  ip_hash text primary key,
  created_at timestamptz not null default now()
);

create index demo_usage_created_at_idx on public.demo_usage (created_at);

alter table public.demo_usage enable row level security;
-- Intentionally no policies.

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- Saves a review and its generated replies in one transaction. Runs as the
-- calling user, so the RLS insert policies above still apply.
create or replace function public.record_generation(
  p_business_id uuid,
  p_content text,
  p_reviewer_name text,
  p_rating smallint,
  p_sentiment text,
  p_replies jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_review_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  insert into public.reviews (user_id, business_id, reviewer_name, rating, content, sentiment)
  values (v_user_id, p_business_id, p_reviewer_name, p_rating, p_content, p_sentiment)
  returning id into v_review_id;

  insert into public.replies (review_id, user_id, variant, content)
  select v_review_id, v_user_id, r ->> 'variant', r ->> 'content'
  from jsonb_array_elements(p_replies) as r;

  return v_review_id;
end;
$$;

revoke execute on function public.record_generation(uuid, text, text, smallint, text, jsonb)
  from public, anon;
grant execute on function public.record_generation(uuid, text, text, smallint, text, jsonb)
  to authenticated;

-- Atomically counts one generation against this month's quota.
-- p_limit = null means unlimited. Returns the new count, or null when the
-- limit has already been reached (nothing is incremented in that case).
create or replace function public.consume_reply_credit(p_user_id uuid, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period date := date_trunc('month', timezone('utc', now()))::date;
  v_count integer;
begin
  if p_limit is not null and p_limit <= 0 then
    return null;
  end if;

  insert into public.usage_counters as uc (user_id, period_start, generations)
  values (p_user_id, v_period, 1)
  on conflict (user_id, period_start) do update
    set generations = uc.generations + 1,
        updated_at = now()
    where p_limit is null or uc.generations < p_limit
  returning uc.generations into v_count;

  return v_count;
end;
$$;

-- Gives back a credit when generation failed after it was consumed.
create or replace function public.refund_reply_credit(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.usage_counters
  set generations = greatest(generations - 1, 0),
      updated_at = now()
  where user_id = p_user_id
    and period_start = date_trunc('month', timezone('utc', now()))::date;
end;
$$;

-- Reserves the single landing-page demo for an IP hash.
-- Returns 'ok', 'already_used' or 'daily_limit'.
create or replace function public.claim_demo_slot(p_ip_hash text, p_daily_limit integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer;
begin
  if exists (select 1 from public.demo_usage where ip_hash = p_ip_hash) then
    return 'already_used';
  end if;

  if (
    select count(*) from public.demo_usage
    where created_at > now() - interval '24 hours'
  ) >= p_daily_limit then
    return 'daily_limit';
  end if;

  insert into public.demo_usage (ip_hash) values (p_ip_hash)
  on conflict (ip_hash) do nothing;
  get diagnostics v_inserted = row_count;

  return case when v_inserted = 1 then 'ok' else 'already_used' end;
end;
$$;

-- Frees a demo slot when generation failed, so the visitor can retry.
create or replace function public.release_demo_slot(p_ip_hash text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.demo_usage where ip_hash = p_ip_hash;
$$;

-- The service-role-only functions must not be callable from the browser.
revoke execute on function public.consume_reply_credit(uuid, integer) from public, anon, authenticated;
revoke execute on function public.refund_reply_credit(uuid) from public, anon, authenticated;
revoke execute on function public.claim_demo_slot(text, integer) from public, anon, authenticated;
revoke execute on function public.release_demo_slot(text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.consume_reply_credit(uuid, integer) to service_role;
grant execute on function public.refund_reply_credit(uuid) to service_role;
grant execute on function public.claim_demo_slot(text, integer) to service_role;
grant execute on function public.release_demo_slot(text) to service_role;
