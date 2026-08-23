-- ============================================================
-- ZimSmartMeter · Agent Noby
-- A proactive energy agent with a firm constitution:
--   · SENSORS are deterministic SQL — no model watches your meter.
--   · The agent PROPOSES; a human APPROVES. The one exception is a
--     standing rule the user explicitly authors (auto top-up with a
--     fixed amount), bounded and rate-limited (one per 6 hours).
--   · Every act lands in agent_events — the agent keeps a journal.
-- Runs every 5 minutes via pg_cron, and on demand per user.
-- ============================================================

create table public.agent_settings (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  enabled           boolean not null default true,
  low_threshold_kwh numeric(10,1) not null default 10.0
                    check (low_threshold_kwh between 1 and 100),
  auto_topup        boolean not null default false,
  auto_topup_usd    numeric(8,2) check (auto_topup_usd between 5.00 and 1000.00),
  updated_at        timestamptz not null default now()
);

create trigger agent_settings_touch
  before update on public.agent_settings
  for each row execute function public.set_updated_at();

create table public.agent_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  meter_id   uuid references public.meters (id) on delete cascade,
  kind       text not null check (kind in
             ('low_balance_proposal','high_usage_alert','auto_topup_executed','info')),
  title      text not null,
  body       text,
  data       jsonb,
  status     text not null default 'open'
             check (status in ('open','approved','dismissed','done')),
  created_at timestamptz not null default now()
);

create index agent_events_open_idx
  on public.agent_events (user_id, created_at desc) where status = 'open';

-- RLS: read own; users may change ONLY an event's status (approve/dismiss)
-- and their own settings. Events are inserted by the agent alone.
alter table public.agent_settings enable row level security;
alter table public.agent_events   enable row level security;

create policy "agent settings read own" on public.agent_settings
  for select to authenticated using (user_id = auth.uid());
create policy "agent settings upsert own" on public.agent_settings
  for insert to authenticated with check (user_id = auth.uid());
create policy "agent settings update own" on public.agent_settings
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "agent events read own" on public.agent_events
  for select to authenticated using (user_id = auth.uid());
create policy "agent events update own" on public.agent_events
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke insert, delete on public.agent_events from authenticated;
revoke update on public.agent_events from authenticated;
grant update (status) on public.agent_events to authenticated;
revoke delete on public.agent_settings from authenticated;

-- ── the sensor pass for one user ────────────────────────────
create or replace function public.agent_evaluate_user(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_set    public.agent_settings%rowtype;
  v_meter  public.meters%rowtype;
  v_tariff public.tariffs%rowtype;
  v_avg    numeric;
  v_today  numeric;
  v_need   numeric;
  v_usd    numeric;
  v_payment public.payments%rowtype;
begin
  select * into v_set from public.agent_settings where user_id = p_uid;
  if not found then
    insert into public.agent_settings (user_id) values (p_uid)
    on conflict do nothing;
    select * into v_set from public.agent_settings where user_id = p_uid;
  end if;
  if not v_set.enabled then return; end if;

  select * into v_tariff from public.tariffs where active;

  for v_meter in
    select * from public.meters where user_id = p_uid
  loop
    -- 7-day average daily usage (excluding today) and today's burn
    select coalesce(sum(energy_kwh) / nullif(count(distinct date(recorded_at)), 0), 0)
      into v_avg
    from public.meter_readings
    where meter_id = v_meter.id
      and recorded_at >= now() - interval '8 days'
      and date(recorded_at) < current_date;

    select coalesce(sum(energy_kwh), 0) into v_today
    from public.meter_readings
    where meter_id = v_meter.id and date(recorded_at) = current_date;

    -- ── low balance ─────────────────────────────────────────
    if v_meter.balance_kwh <= v_set.low_threshold_kwh then

      -- Standing rule first: user-authored auto top-up, once per 6h.
      if v_set.auto_topup and v_set.auto_topup_usd is not null
         and v_tariff.id is not null
         and not exists (
           select 1 from public.agent_events
           where user_id = p_uid and meter_id = v_meter.id
             and kind = 'auto_topup_executed'
             and created_at > now() - interval '6 hours')
      then
        insert into public.payments
          (user_id, meter_id, amount_usd, status, method, idempotency_key)
        values
          (p_uid, v_meter.id, v_set.auto_topup_usd, 'succeeded', 'instant',
           gen_random_uuid())
        returning * into v_payment;

        perform public.complete_purchase(v_payment, v_meter);
        select * into v_meter from public.meters where id = v_meter.id;

        insert into public.agent_events
          (user_id, meter_id, kind, title, body, data, status)
        values
          (p_uid, v_meter.id, 'auto_topup_executed',
           'Noby topped up $' || v_set.auto_topup_usd,
           'Balance hit ' || round(v_meter.balance_kwh - v_set.auto_topup_usd * v_tariff.rate_kwh_per_usd, 1)
             || ' kWh, below your ' || v_set.low_threshold_kwh
             || ' kWh rule — bought $' || v_set.auto_topup_usd
             || ' as you instructed. New balance ' || v_meter.balance_kwh || ' kWh.',
           jsonb_build_object('amount_usd', v_set.auto_topup_usd,
                              'payment_ref', v_payment.payment_ref),
           'done');

      -- Otherwise: propose, sized from real usage (≈ a week of power).
      elsif not exists (
          select 1 from public.agent_events
          where user_id = p_uid and meter_id = v_meter.id
            and kind = 'low_balance_proposal' and status = 'open')
        and v_tariff.id is not null
      then
        v_need := greatest(v_avg * 7, 29.4) - v_meter.balance_kwh;
        v_usd  := least(1000, greatest(5, ceil(v_need / v_tariff.rate_kwh_per_usd)));

        insert into public.agent_events
          (user_id, meter_id, kind, title, body, data)
        values
          (p_uid, v_meter.id, 'low_balance_proposal',
           'Top up $' || v_usd || '?',
           'Balance is ' || v_meter.balance_kwh || ' kWh — under your '
             || v_set.low_threshold_kwh || ' kWh threshold. $' || v_usd
             || ' buys ' || round(v_usd * v_tariff.rate_kwh_per_usd, 1)
             || ' kWh — about a week at your recent '
             || round(v_avg, 1) || ' kWh/day.',
           jsonb_build_object('suggested_usd', v_usd,
                              'avg_daily_kwh', round(v_avg, 1)));

        insert into public.notifications (user_id, title, body)
        values (p_uid, 'Noby: top-up suggested',
                'Meter ' || v_meter.meter_number || ' is low — Noby has a proposal on your dashboard.');
      end if;
    end if;

    -- ── running hot: today ≥ 2× the recent daily average ───
    if v_avg >= 0.5 and v_today >= v_avg * 2
       and not exists (
         select 1 from public.agent_events
         where user_id = p_uid and meter_id = v_meter.id
           and kind = 'high_usage_alert'
           and date(created_at) = current_date)
    then
      insert into public.agent_events
        (user_id, meter_id, kind, title, body, data)
      values
        (p_uid, v_meter.id, 'high_usage_alert',
         'Running hot today',
         'Meter ' || v_meter.meter_number || ' has used '
           || round(v_today, 1) || ' kWh today — over twice your usual '
           || round(v_avg, 1) || ' kWh/day. A geyser or heater left on?',
         jsonb_build_object('today_kwh', round(v_today, 1),
                            'avg_daily_kwh', round(v_avg, 1)));
    end if;
  end loop;
end $$;

-- On-demand tick for the signed-in user (the dashboard's "Run Noby now").
create or replace function public.agent_tick_self()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;
  perform public.agent_evaluate_user(auth.uid());
  return jsonb_build_object('ok', true);
end $$;

-- The scheduled sweep across everyone with meters.
create or replace function public.agent_tick_all()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_uid uuid;
begin
  for v_uid in select distinct user_id from public.meters loop
    begin
      perform public.agent_evaluate_user(v_uid);
    exception when others then
      -- One user's bad day must not stop the sweep.
      insert into public.audit_logs (user_id, action, detail)
      values (v_uid, 'agent.tick_error',
              jsonb_build_object('error', sqlerrm));
    end;
  end loop;
end $$;

revoke execute on function public.agent_evaluate_user(uuid) from public, anon, authenticated;
grant  execute on function public.agent_evaluate_user(uuid) to service_role;
revoke execute on function public.agent_tick_all() from public, anon, authenticated;
revoke execute on function public.agent_tick_self() from public, anon;
grant  execute on function public.agent_tick_self() to authenticated;

-- Every 5 minutes, forever, server-side. (Guarded: environments without
-- pg_cron — local Postgres, CI — must not abort the rest of the migration.)
do $$ begin
  create extension if not exists pg_cron;
exception when others then null;
end $$;
do $$ begin
  perform cron.schedule('agent-noby-tick', '*/5 * * * *',
                        'select public.agent_tick_all()');
exception when others then null; -- already scheduled
end $$;

-- Live pop-in for proposals and journal entries.
alter publication supabase_realtime add table public.agent_events;
