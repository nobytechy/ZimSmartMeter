-- ============================================================
-- ZimSmartMeter · Phase 2: telemetry, presence, realtime
--
--   · record_reading(): the device path. The in-app simulator is
--     an authenticated "device" owned by the user, so ingestion is
--     owner-checked. Consumption DECREMENTS the balance (floored
--     at zero — prepaid meters don't go negative), refreshes
--     presence, and fires a low-balance notification exactly once
--     when the balance crosses below 10 kWh.
--   · set_meter_presence(): start/stop marks online/offline. MQTT
--     LWT covers crash-offline for broker subscribers; last_seen
--     staleness covers it for the dashboard.
--   · get_daily_consumption(): SECURITY INVOKER on purpose — it
--     runs as the caller so RLS on meter_readings does the
--     filtering. Not every function should be DEFINER.
--   · Realtime: meters and transactions join the publication so
--     balances tick and ledgers grow on-screen without refresh.
-- ============================================================

create or replace function public.record_reading(
  p_meter_id   uuid,
  p_voltage    numeric,
  p_current_a  numeric,
  p_power_w    numeric,
  p_energy_kwh numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_meter public.meters%rowtype;
  v_new   numeric(10,1);
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;
  if p_energy_kwh is null or p_energy_kwh < 0 or p_energy_kwh > 10 then
    return jsonb_build_object('ok', false, 'reason', 'bad_energy');
  end if;

  select * into v_meter
  from public.meters
  where id = p_meter_id and user_id = v_uid
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'meter_not_found');
  end if;

  insert into public.meter_readings
    (meter_id, voltage, current_a, power_w, energy_kwh)
  values
    (p_meter_id, p_voltage, p_current_a, p_power_w, p_energy_kwh);

  v_new := round(greatest(0, v_meter.balance_kwh - p_energy_kwh), 1);

  update public.meters
  set balance_kwh = v_new,
      status = 'online',
      last_seen_at = now()
  where id = p_meter_id;

  -- Cross below 10 kWh → exactly one warning per crossing.
  if v_meter.balance_kwh > 10 and v_new <= 10 then
    insert into public.notifications (user_id, title, body)
    values (v_uid, 'Low balance',
            'Meter ' || v_meter.meter_number || ' is down to '
            || v_new || ' kWh. Top up before the lights notice.');
  end if;

  return jsonb_build_object('ok', true, 'balance_kwh', v_new);
end $$;

create or replace function public.set_meter_presence(
  p_meter_id uuid,
  p_online   boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  update public.meters
  set status = case when p_online then 'online' else 'offline' end,
      last_seen_at = now()
  where id = p_meter_id and user_id = v_uid;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'meter_not_found');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- INVOKER: the caller's own RLS scopes the rows. No privilege needed.
create or replace function public.get_daily_consumption(p_meter_id uuid)
returns table (day date, kwh numeric)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select date(recorded_at) as day,
         round(sum(energy_kwh)::numeric, 1) as kwh
  from public.meter_readings
  where meter_id = p_meter_id
    and recorded_at > now() - interval '14 days'
  group by 1
  order by 1;
$$;

revoke execute on function public.record_reading(uuid, numeric, numeric, numeric, numeric) from public, anon;
revoke execute on function public.set_meter_presence(uuid, boolean) from public, anon;
revoke execute on function public.get_daily_consumption(uuid) from public, anon;
grant execute on function public.record_reading(uuid, numeric, numeric, numeric, numeric) to authenticated;
grant execute on function public.set_meter_presence(uuid, boolean) to authenticated;
grant execute on function public.get_daily_consumption(uuid) to authenticated;

-- Live balances and a live ledger, straight over Supabase Realtime.
alter publication supabase_realtime add table public.meters;
alter publication supabase_realtime add table public.transactions;
