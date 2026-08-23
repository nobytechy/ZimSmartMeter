-- ============================================================
-- ZimSmartMeter · direct PayNow gateway
--   · payments gains gateway_ref (PayNow's own reference) and
--     gateway_poll_url (where the truth about this payment lives).
--   · purchase_electricity now accepts method 'paynow' — pending
--     path, identical shape to cash and manishapay.
--   · settle_gateway_payment persists the provider reference on
--     the payment row for the audit trail.
-- The mp_/PayNow keys never appear here: the paynow Edge Function
-- is the only place hashes are computed and verified.
-- ============================================================

alter table public.payments
  add column gateway_ref text,
  add column gateway_poll_url text;

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
  if p_method not in ('instant', 'cash', 'manishapay', 'paynow') then
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

  if p_method <> 'instant' then
    insert into public.audit_logs (user_id, action, entity, entity_id, detail)
    values (v_uid, 'purchase.pending_created', 'payments', v_payment.id,
            jsonb_build_object('payment_ref', v_payment.payment_ref,
                               'method', p_method,
                               'amount_usd', p_amount_usd,
                               'meter_number', v_meter.meter_number));
    return jsonb_build_object(
      'ok', true, 'duplicate', false, 'pending', true,
      'method', p_method,
      'payment_id', v_payment.id,
      'payment_ref', v_payment.payment_ref,
      'amount_usd', p_amount_usd);
  end if;

  return public.complete_purchase(v_payment, v_meter);
end $$;

create or replace function public.settle_gateway_payment(
  p_payment_ref  text,
  p_outcome      text,
  p_provider_ref text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_meter   public.meters%rowtype;
begin
  if p_outcome not in ('paid', 'failed') then
    return jsonb_build_object('ok', false, 'reason', 'bad_outcome');
  end if;

  select * into v_payment
  from public.payments
  where payment_ref = p_payment_ref
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'payment_not_found');
  end if;
  if v_payment.method not in ('manishapay', 'paynow') then
    return jsonb_build_object('ok', false, 'reason', 'not_gateway');
  end if;

  update public.payments
  set gateway_ref = coalesce(p_provider_ref, gateway_ref)
  where id = v_payment.id;

  select * into v_meter
  from public.meters
  where id = v_payment.meter_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'meter_not_found');
  end if;

  if v_payment.status = 'succeeded' then
    return public.purchase_replay(v_payment, v_meter.balance_kwh);
  end if;
  if v_payment.status = 'failed' then
    return jsonb_build_object('ok', true, 'pending', false, 'failed', true,
                              'payment_ref', v_payment.payment_ref);
  end if;

  if p_outcome = 'failed' then
    update public.payments set status = 'failed' where id = v_payment.id;
    insert into public.audit_logs (user_id, action, entity, entity_id, detail)
    values (v_payment.user_id, 'purchase.gateway_failed', 'payments',
            v_payment.id,
            jsonb_build_object('payment_ref', v_payment.payment_ref,
                               'provider_ref', p_provider_ref));
    return jsonb_build_object('ok', true, 'pending', false, 'failed', true,
                              'payment_ref', v_payment.payment_ref);
  end if;

  insert into public.audit_logs (user_id, action, entity, entity_id, detail)
  values (v_payment.user_id, 'purchase.gateway_settled', 'payments',
          v_payment.id,
          jsonb_build_object('payment_ref', v_payment.payment_ref,
                             'provider_ref', p_provider_ref,
                             'method', v_payment.method));

  return public.complete_purchase(v_payment, v_meter);
end $$;
