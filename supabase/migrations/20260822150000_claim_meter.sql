-- ============================================================
-- ZimSmartMeter · meter claiming
-- Two SECURITY DEFINER functions form the ONLY way meters come
-- into existence — our stand-in for calling the utility's API.
--
-- Concurrency truths taught here:
--   · check-then-insert is a race (TOCTOU). The UNIQUE constraint
--     on meters.registry_id is the referee; we attempt the insert
--     and let a unique_violation tell us we lost.
--   · claim_random_demo_meter uses FOR UPDATE SKIP LOCKED so two
--     visitors tapping "demo meter" at once cannot pick the same
--     registry row.
--   · Functions default to EXECUTE for PUBLIC in Postgres — we
--     revoke that and grant only to authenticated. Verify > trust.
-- ============================================================

create or replace function public.claim_meter(p_meter_number text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_reg   public.meter_registry%rowtype;
  v_meter public.meters%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  if p_meter_number !~ '^[0-9]{11}$' then
    return jsonb_build_object('ok', false, 'reason', 'bad_format');
  end if;

  select * into v_reg
  from public.meter_registry
  where meter_number = p_meter_number;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_reg.status <> 'active' then
    -- 'disconnected' or 'tampered' — the registry's word is final.
    return jsonb_build_object('ok', false, 'reason', v_reg.status);
  end if;

  begin
    insert into public.meters (user_id, registry_id, meter_number)
    values (v_uid, v_reg.id, v_reg.meter_number)
    returning * into v_meter;
  exception when unique_violation then
    select * into v_meter from public.meters where registry_id = v_reg.id;
    if v_meter.user_id = v_uid then
      return jsonb_build_object('ok', false, 'reason', 'already_yours');
    end if;
    return jsonb_build_object('ok', false, 'reason', 'already_claimed');
  end;

  insert into public.audit_logs (user_id, action, entity, entity_id, detail)
  values (v_uid, 'meter.claimed', 'meters', v_meter.id,
          jsonb_build_object('meter_number', v_meter.meter_number,
                             'area', v_reg.area));

  return jsonb_build_object(
    'ok', true,
    'meter', jsonb_build_object(
      'id', v_meter.id,
      'meter_number', v_meter.meter_number,
      'balance_kwh', v_meter.balance_kwh,
      'status', v_meter.status));
end $$;

create or replace function public.claim_random_demo_meter()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_reg public.meter_registry%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  select r.* into v_reg
  from public.meter_registry r
  where r.status = 'active'
    and not exists (select 1 from public.meters m where m.registry_id = r.id)
  order by random()
  limit 1
  for update skip locked;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'none_available');
  end if;

  return public.claim_meter(v_reg.meter_number);
end $$;

revoke execute on function public.claim_meter(text)        from public, anon;
revoke execute on function public.claim_random_demo_meter() from public, anon;
grant  execute on function public.claim_meter(text)        to authenticated;
grant  execute on function public.claim_random_demo_meter() to authenticated;
