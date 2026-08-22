-- ============================================================
-- ZimSmartMeter · initial schema
-- Apply via the Supabase SQL editor, or `supabase db push`.
--
-- Principles:
--   · UUID primary keys everywhere.
--   · The database enforces every money-critical invariant with
--     constraints — the frontend is never the last line of defence.
--   · Row Level Security is enabled from birth on every table.
--     No policies exist yet (stage 1C), so everything is DENY-ALL
--     to the anon/authenticated roles. Deliberate: safe by default.
--   · All seed data is clearly synthetic demo data.
-- ============================================================

create extension if not exists pgcrypto;

-- ── helper: keep updated_at honest ──────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================
-- profiles — one row per authenticated person.
-- Identity is auth.uid(); phone is an attribute, never the key,
-- so swapping test OTPs for a real SMS provider changes nothing.
-- ============================================================
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  phone      text not null unique,
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-provision a profile the moment Supabase Auth creates a user.
-- SECURITY DEFINER: runs with owner rights because the signing-up user
-- has no permissions yet at this point.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, coalesce(new.phone, 'unknown-' || new.id::text));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- meter_registry — our stand-in for the utility's master meter
-- database. Clients NEVER read this table directly (no policies
-- will ever grant it); verification happens through a function,
-- exactly as a real utility API would be called. Meter numbers
-- are 11 digits with a Luhn check digit.
-- ============================================================
create table public.meter_registry (
  id           uuid primary key default gen_random_uuid(),
  meter_number text not null unique check (meter_number ~ '^[0-9]{11}$'),
  status       text not null check (status in ('active','disconnected','tampered')),
  tariff_class text not null default 'domestic',
  area         text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- tariffs — pricing is data, never hardcoded. A partial unique
-- index guarantees at most ONE active tariff at any moment.
-- ============================================================
create table public.tariffs (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  rate_kwh_per_usd numeric(8,4) not null check (rate_kwh_per_usd > 0),
  active           boolean not null default false,
  effective_from   timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create unique index tariffs_one_active on public.tariffs (active) where active;

-- ============================================================
-- meters — a registry meter CLAIMED by a user. unique(registry_id)
-- makes "one active owner per meter" structurally impossible to
-- violate, no matter what the application layer does.
-- ============================================================
create table public.meters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  registry_id  uuid not null unique references public.meter_registry (id),
  meter_number text not null,
  nickname     text,
  balance_kwh  numeric(10,1) not null default 0 check (balance_kwh >= 0),
  status       text not null default 'online' check (status in ('online','offline')),
  last_seen_at timestamptz,
  created_at   timestamptz not null default now()
);

create index meters_user_idx on public.meters (user_id);

-- ============================================================
-- payments — one row per payment event. Two independent locks:
--   payment_ref      server-assigned, human-readable (PAY-000001)
--   idempotency_key  client-generated UUID, UNIQUE — the reason a
--                    retried/replayed payment can never exist twice.
-- Amounts are fixed demo denominations, enforced here, not in JS.
-- ============================================================
create sequence public.payment_ref_seq;

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  payment_ref     text not null unique
                  default 'PAY-' || lpad(nextval('public.payment_ref_seq')::text, 6, '0'),
  amount_usd      numeric(8,2) not null check (amount_usd in (10.00, 20.00, 50.00, 100.00)),
  status          text not null default 'pending'
                  check (status in ('pending','succeeded','failed')),
  idempotency_key uuid not null unique,
  created_at      timestamptz not null default now()
);

create index payments_user_idx on public.payments (user_id, created_at desc);

-- ============================================================
-- electricity_purchases — the business event: user X bought Y kWh
-- for meter Z at tariff T. kWh is SNAPSHOTTED at purchase time so
-- later tariff changes never rewrite history. unique(payment_id):
-- one payment funds exactly one purchase.
-- ============================================================
create table public.electricity_purchases (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  meter_id   uuid not null references public.meters (id) on delete cascade,
  payment_id uuid not null unique references public.payments (id),
  tariff_id  uuid not null references public.tariffs (id),
  amount_usd numeric(8,2) not null,
  kwh        numeric(10,1) not null check (kwh > 0),
  created_at timestamptz not null default now()
);

create index purchases_user_idx  on public.electricity_purchases (user_id, created_at desc);
create index purchases_meter_idx on public.electricity_purchases (meter_id, created_at desc);

-- ============================================================
-- meter_credits — the delivery of a purchase onto a meter.
-- unique(purchase_id) is the second idempotency backstop:
-- even a bug that reprocesses a purchase cannot credit twice.
-- ============================================================
create table public.meter_credits (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null unique references public.electricity_purchases (id),
  meter_id    uuid not null references public.meters (id) on delete cascade,
  kwh         numeric(10,1) not null check (kwh > 0),
  applied_at  timestamptz not null default now()
);

-- ============================================================
-- transactions — the user-facing ledger, written only by the
-- purchase function (stage 1F). Read-optimised, append-only.
-- ============================================================
create table public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  meter_id   uuid references public.meters (id) on delete set null,
  type       text not null check (type in ('purchase','credit','adjustment')),
  amount_usd numeric(8,2),
  kwh        numeric(10,1),
  ref        text,
  created_at timestamptz not null default now()
);

create index transactions_user_idx on public.transactions (user_id, created_at desc);

-- ============================================================
-- meter_readings — telemetry lands here in Phase 2 (MQTT).
-- Modelled now so the dashboard can be built against real shape.
-- ============================================================
create table public.meter_readings (
  id          uuid primary key default gen_random_uuid(),
  meter_id    uuid not null references public.meters (id) on delete cascade,
  voltage     numeric(6,2),
  current_a   numeric(6,2),
  power_w     numeric(8,2),
  energy_kwh  numeric(10,3),
  recorded_at timestamptz not null default now()
);

create index readings_meter_idx on public.meter_readings (meter_id, recorded_at desc);

-- ============================================================
-- audit_logs — every money-touching action leaves a trace.
-- ============================================================
create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  uuid,
  detail     jsonb,
  created_at timestamptz not null default now()
);

create index audit_user_idx on public.audit_logs (user_id, created_at desc);

-- ============================================================
-- notifications — low-balance alerts etc. (used from Phase 2).
-- ============================================================
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_unread_idx on public.notifications (user_id) where not read;

-- ============================================================
-- Row Level Security: ON for every table, from birth.
-- No policies yet ⇒ deny-all for anon/authenticated roles.
-- Stage 1C introduces the policies deliberately, one by one.
-- ============================================================
alter table public.profiles              enable row level security;
alter table public.meter_registry        enable row level security;
alter table public.tariffs               enable row level security;
alter table public.meters                enable row level security;
alter table public.payments              enable row level security;
alter table public.electricity_purchases enable row level security;
alter table public.meter_credits         enable row level security;
alter table public.transactions          enable row level security;
alter table public.meter_readings        enable row level security;
alter table public.audit_logs            enable row level security;
alter table public.notifications         enable row level security;

-- ============================================================
-- Seeds — synthetic demo data only.
-- Tariff: $1 = 2.94 kWh  ⇒  $10 → 29.4 · $20 → 58.8 · $100 → 294.0
-- Registry: Luhn-valid 11-digit numbers; failure rows are deliberate
-- so the demo can show verification REJECTING a meter, not just
-- accepting one.
-- ============================================================
insert into public.tariffs (name, rate_kwh_per_usd, active)
values ('Domestic demo tariff 2026', 2.9400, true);

insert into public.meter_registry (meter_number, status, area) values
  ('04789846773', 'active',       'Harare CBD'),
  ('04147052668', 'active',       'Mbare'),
  ('04954653178', 'active',       'Avondale'),
  ('04391388917', 'active',       'Borrowdale'),
  ('04209297607', 'active',       'Highfield'),
  ('04437808928', 'active',       'Bulawayo'),
  ('04956360962', 'active',       'Gweru'),
  ('04273751943', 'active',       'Mutare'),
  ('04723331445', 'active',       'Chitungwiza'),
  ('04827711450', 'active',       'Kwekwe'),
  ('04545682827', 'disconnected', 'Harare CBD'),
  ('04112447232', 'disconnected', 'Masvingo'),
  ('04514800855', 'tampered',     'Norton');
