-- ============================================================
-- ZimSmartMeter · payment methods + flexible amounts
--
--   · Amounts: any value from $5.00 to $1,000.00, two decimals.
--     The old fixed-denomination CHECK is replaced — the database
--     stays the authority on what a legal amount is.
--   · payments.method: 'instant' (simulated, completes at once),
--     'cash' (pending until an agent confirms), and reserved
--     slots 'paynow' and 'manishapay' for the real gateways.
--   · payments.meter_id: a pending payment must remember which
--     meter it is for, so completion can happen later.
--   · Cash flow: purchase_electricity() creates a PENDING payment
--     and returns a reference; confirm_cash_payment() completes
--     it atomically — purchase, credit, balance, ledger, audit —
--     pricing at the tariff active AT CONFIRMATION time.
--   · Same key ⇒ same answer still holds everywhere: replaying a
--     pending cash initiation returns the same pending reference;
--     replaying a completed payment returns the original receipt;
--     confirming twice returns the first receipt.
-- ============================================================

alter table public.payments
  drop constraint payments_amount_usd_check;

alter table public.payments
  add constraint payments_amount_range
  check (amount_usd >= 5.00 and amount_usd <= 1000.00);

alter table public.payments
  add column method text not null default 'instant'
    check (method in ('instant','cash','paynow','manishapay')),
  add column meter_id uuid references public.meters (id) on delete set null;

-- The signature changes, so the old overload must go — otherwise
-- PostgREST sees two purchase_electricity functions and refuses both.
drop function if exists public.purchase_electricity(uuid, numeric, uuid);
drop function if exists public.purchase_replay(public.payments, numeric);

-- ── shared: complete a payment into credit, atomically ──────
-- Assumes the meter row is already locked by the caller.
create or replace function public.complete_purchase(
  p_payment public.payments,
  p_meter   public.meters
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_tariff   public.tariffs%rowtype;
  v_purchase public.electricity_purchases%rowtype;
  v_kwh      numeric(10,1);
  v_balance  numeric(10,1);
begin
  select * into v_tariff from public.tariffs where active;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_active_tariff');
  end if;

  v_kwh := round(p_payment.amount_usd * v_tariff.rate_kwh_per_usd, 1);

  update public.payments
  set status = 'succeeded'
  where id = p_payment.id;

  insert into public.electricity_purchases
    (user_id, meter_id, payment_id, tariff_id, amount_usd, kwh)
  values
    (p_payment.user_id, p_meter.id, p_payment.id, v_tariff.id,
     p_payment.amount_usd, v_kwh)
  returning * into v_purchase;

  insert into public.meter_credits (purchase_id, meter_id, kwh)
  values (v_purchase.id, p_meter.id, v_kwh);

  update public.meters
  set balance_kwh = balance_kwh + v_kwh,
      last_seen_at = now()
  where id = p_meter.id
  returning balance_kwh into v_balance;

  insert into public.transactions (user_id, meter_id, type, amount_usd, ref)
  values (p_payment.user_id, p_meter.id, 'purchase',
          p_payment.amount_usd, p_payment.payment_ref);

  insert into public.transactions (user_id, meter_id, type, kwh, ref)
  values (p_payment.user_id, p_meter.id, 'credit', v_kwh,
          p_payment.payment_ref);

  insert into public.audit_logs (user_id, action, entity, entity_id, detail)
  values (p_payment.user_id, 'purchase.completed', 'payments', p_payment.id,
          jsonb_build_object(
            'payment_ref', p_payment.payment_ref,
            'method', p_payment.method,
            'meter_number', p_meter.meter_number,
            'amount_usd', p_payment.amount_usd,
            'kwh', v_kwh,
            'new_balance', v_balance));

  return jsonb_build_object(
    'ok', true, 'duplicate', false, 'pending', false,
    'method', p_payment.method,
    'payment_ref', p_payment.payment_ref,
    'amount_usd', p_payment.amount_usd,
    'kwh', v_kwh, 'new_balance', v_balance, 'meter_id', p_meter.id);
end $$;

-- ── shared: answer a replayed key with the truthful state ───
create or replace function public.purchase_replay(
  p_payment         public.payments,
  p_current_balance numeric
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_purchase public.electricity_purchases%rowtype;
begin
  if p_payment.status = 'pending' then
    return jsonb_build_object(
      'ok', true, 'duplicate', true, 'pending', true,
      'method', p_payment.method,
      'payment_id', p_payment.id,
      'payment_ref', p_payment.payment_ref,
      'amount_usd', p_payment.amount_usd);
  end if;

  select * into v_purchase
  from public.electricity_purchases
  where payment_id = p_payment.id;

  return jsonb_build_object(
    'ok', true, 'duplicate', true, 'pending', false,
    'method', p_payment.method,
    'payment_ref', p_payment.payment_ref,
    'amount_usd', p_payment.amount_usd,
    'kwh', coalesce(v_purchase.kwh, 0),
    'new_balance', p_current_balance,
    'meter_id', v_purchase.meter_id);
end $$;

-- ── the door: initiate a purchase ───────────────────────────
create or replace function public.purchase_electricity(
  p_meter_id        uuid,
  p_amount_usd      numeric,
  p_idempotency_key uuid,
  p_method          text default 'instant'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid     uuid := auth.uid();
  v_meter   public.meters%rowtype;
  v_payment public.payments%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;
  if p_idempotency_key is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_key');
  end if;
  if p_amount_usd is null
     or p_amount_usd < 5.00 or p_amount_usd > 1000.00
     or round(p_amount_usd, 2) <> p_amount_usd then
    return jsonb_build_object('ok', false, 'reason', 'bad_amount');
  end if;
  if p_method not in ('instant', 'cash') then
    -- 'paynow' and 'manishapay' are reserved; they arrive with their
    -- gateway integrations and will refuse until then.
    return jsonb_build_object('ok', false, 'reason', 'method_unavailable');
  end if;

  select * into v_meter
  from public.meters
  where id = p_meter_id and user_id = v_uid
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'meter_not_found');
  end if;

  select * into v_payment
  from public.payments
  where idempotency_key = p_idempotency_key;

  if found then
    if v_payment.user_id <> v_uid then
      return jsonb_build_object('ok', false, 'reason', 'key_conflict');
    end if;
    return public.purchase_replay(v_payment, v_meter.balance_kwh);
  end if;

  begin
    insert into public.payments
      (user_id, meter_id, amount_usd, status, method, idempotency_key)
    values
      (v_uid, v_meter.id, p_amount_usd,
       case when p_method = 'instant' then 'succeeded' else 'pending' end,
       p_method, p_idempotency_key)
    returning * into v_payment;
  exception when unique_violation then
    select * into v_payment
    from public.payments
    where idempotency_key = p_idempotency_key;
    if v_payment.user_id <> v_uid then
      return jsonb_build_object('ok', false, 'reason', 'key_conflict');
    end if;
    return public.purchase_replay(v_payment, v_meter.balance_kwh);
  end;

  if p_method = 'cash' then
    insert into public.audit_logs (user_id, action, entity, entity_id, detail)
    values (v_uid, 'purchase.cash_pending', 'payments', v_payment.id,
            jsonb_build_object('payment_ref', v_payment.payment_ref,
                               'amount_usd', p_amount_usd,
                               'meter_number', v_meter.meter_number));
    return jsonb_build_object(
      'ok', true, 'duplicate', false, 'pending', true,
      'method', 'cash',
      'payment_id', v_payment.id,
      'payment_ref', v_payment.payment_ref,
      'amount_usd', p_amount_usd);
  end if;

  return public.complete_purchase(v_payment, v_meter);
end $$;

-- ── cash confirmation (demo stands in for the agent) ────────
create or replace function public.confirm_cash_payment(p_payment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid     uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_meter   public.meters%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  select * into v_payment
  from public.payments
  where id = p_payment_id and user_id = v_uid
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'payment_not_found');
  end if;
  if v_payment.method <> 'cash' then
    return jsonb_build_object('ok', false, 'reason', 'not_cash');
  end if;

  select * into v_meter
  from public.meters
  where id = v_payment.meter_id and user_id = v_uid
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'meter_not_found');
  end if;

  if v_payment.status = 'succeeded' then
    -- Confirming twice returns the first receipt. Nothing moves.
    return public.purchase_replay(v_payment, v_meter.balance_kwh);
  end if;
  if v_payment.status = 'failed' then
    return jsonb_build_object('ok', false, 'reason', 'payment_failed');
  end if;

  return public.complete_purchase(v_payment, v_meter);
end $$;

-- ── execute hygiene ─────────────────────────────────────────
revoke execute on function public.complete_purchase(public.payments, public.meters)
  from public, anon, authenticated;
revoke execute on function public.purchase_replay(public.payments, numeric)
  from public, anon, authenticated;
revoke execute on function public.purchase_electricity(uuid, numeric, uuid, text)
  from public, anon;
revoke execute on function public.confirm_cash_payment(uuid)
  from public, anon;
grant execute on function public.purchase_electricity(uuid, numeric, uuid, text)
  to authenticated;
grant execute on function public.confirm_cash_payment(uuid)
  to authenticated;
