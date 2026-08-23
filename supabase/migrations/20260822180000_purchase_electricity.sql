-- ============================================================
-- ZimSmartMeter · purchase_electricity
-- The single door into the money flow. One function, one
-- transaction: payment, purchase, credit, balance, ledger and
-- audit all commit together — or none of them exist. A network
-- cable pulled at ANY line of this function leaves the world
-- consistent.
--
-- Idempotency semantics (the 1G lesson, fused in):
--   · The client mints one UUID per purchase INTENT and reuses
--     it on retries of that intent.
--   · Same key ⇒ same answer. A replay returns the ORIGINAL
--     result flagged duplicate:true — it never credits again.
--   · Two racers with one key: the UNIQUE constraint picks the
--     winner; the loser is answered with the winner's result.
--   · FOR UPDATE on the meter row serializes concurrent buys on
--     one meter, and proves ownership in the same breath.
-- ============================================================

-- Internal helper: answer a replayed key with the original outcome.
-- Not part of the API surface — no role may call it directly.
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
  select * into v_purchase
  from public.electricity_purchases
  where payment_id = p_payment.id;

  return jsonb_build_object(
    'ok', true,
    'duplicate', true,
    'payment_ref', p_payment.payment_ref,
    'amount_usd', p_payment.amount_usd,
    'kwh', coalesce(v_purchase.kwh, 0),
    'new_balance', p_current_balance,
    'meter_id', v_purchase.meter_id);
end $$;

create or replace function public.purchase_electricity(
  p_meter_id        uuid,
  p_amount_usd      numeric,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid      uuid := auth.uid();
  v_meter    public.meters%rowtype;
  v_tariff   public.tariffs%rowtype;
  v_payment  public.payments%rowtype;
  v_purchase public.electricity_purchases%rowtype;
  v_kwh      numeric(10,1);
  v_balance  numeric(10,1);
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  if p_idempotency_key is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_key');
  end if;

  if p_amount_usd is null
     or p_amount_usd not in (10.00, 20.00, 50.00, 100.00) then
    return jsonb_build_object('ok', false, 'reason', 'bad_amount');
  end if;

  -- Lock the meter row: serializes concurrent purchases on this meter
  -- and enforces ownership — your meter, or it does not exist.
  select * into v_meter
  from public.meters
  where id = p_meter_id and user_id = v_uid
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'meter_not_found');
  end if;

  -- Replay check: same key ⇒ same answer, zero side effects.
  select * into v_payment
  from public.payments
  where idempotency_key = p_idempotency_key;

  if found then
    if v_payment.user_id <> v_uid then
      return jsonb_build_object('ok', false, 'reason', 'key_conflict');
    end if;
    return public.purchase_replay(v_payment, v_meter.balance_kwh);
  end if;

  select * into v_tariff from public.tariffs where active;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_active_tariff');
  end if;

  v_kwh := round(p_amount_usd * v_tariff.rate_kwh_per_usd, 1);

  -- Demo simulates instant success; a real PSP would insert 'pending'
  -- here and a webhook would complete it. The shape already allows it.
  begin
    insert into public.payments (user_id, amount_usd, status, idempotency_key)
    values (v_uid, p_amount_usd, 'succeeded', p_idempotency_key)
    returning * into v_payment;
  exception when unique_violation then
    -- Two racers, one key: the constraint picked the winner.
    select * into v_payment
    from public.payments
    where idempotency_key = p_idempotency_key;
    if v_payment.user_id <> v_uid then
      return jsonb_build_object('ok', false, 'reason', 'key_conflict');
    end if;
    return public.purchase_replay(v_payment, v_meter.balance_kwh);
  end;

  insert into public.electricity_purchases
    (user_id, meter_id, payment_id, tariff_id, amount_usd, kwh)
  values
    (v_uid, v_meter.id, v_payment.id, v_tariff.id, p_amount_usd, v_kwh)
  returning * into v_purchase;

  insert into public.meter_credits (purchase_id, meter_id, kwh)
  values (v_purchase.id, v_meter.id, v_kwh);

  update public.meters
  set balance_kwh = balance_kwh + v_kwh,
      last_seen_at = now()
  where id = v_meter.id
  returning balance_kwh into v_balance;

  insert into public.transactions (user_id, meter_id, type, amount_usd, ref)
  values (v_uid, v_meter.id, 'purchase', p_amount_usd, v_payment.payment_ref);

  insert into public.transactions (user_id, meter_id, type, kwh, ref)
  values (v_uid, v_meter.id, 'credit', v_kwh, v_payment.payment_ref);

  insert into public.audit_logs (user_id, action, entity, entity_id, detail)
  values (v_uid, 'purchase.completed', 'payments', v_payment.id,
          jsonb_build_object(
            'payment_ref', v_payment.payment_ref,
            'meter_number', v_meter.meter_number,
            'amount_usd', p_amount_usd,
            'kwh', v_kwh,
            'new_balance', v_balance));

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'payment_ref', v_payment.payment_ref,
    'amount_usd', p_amount_usd,
    'kwh', v_kwh,
    'new_balance', v_balance,
    'meter_id', v_meter.id);
end $$;

-- Execute hygiene: the API surface is exactly one function.
revoke execute on function public.purchase_replay(public.payments, numeric)
  from public, anon, authenticated;
revoke execute on function public.purchase_electricity(uuid, numeric, uuid)
  from public, anon;
grant execute on function public.purchase_electricity(uuid, numeric, uuid)
  to authenticated;
