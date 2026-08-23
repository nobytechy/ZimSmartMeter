-- ============================================================
-- ZimSmartMeter · Row Level Security policies
-- Apply after the initial schema migration.
--
-- The model:
--   · Reads: a user sees only their own rows. Ever.
--   · Writes: clients get almost none. Meters are created by
--     claim_meter() (stage 1E); payments/purchases/credits/
--     transactions are written by purchase_electricity() (1F).
--     Those functions are SECURITY DEFINER and bypass these
--     restrictions deliberately and auditable-y.
--   · Columns: RLS gates rows; GRANTs gate columns. A user may
--     update their meter — but only its nickname. balance_kwh
--     is unreachable from any client, session or not.
--   · anon (not signed in) can touch nothing at all.
-- ============================================================

-- ── the signed-out role gets nothing ────────────────────────
revoke all on all tables in schema public from anon;

-- ── profiles: read own · update own name only ───────────────
create policy "profiles read own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "profiles update own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- ── meter_registry: NO policies. Deny-all forever. ──────────
-- Verification goes through a function — our stand-in for the
-- utility's API. Nobody queries the "utility database" directly.
revoke all on public.meter_registry from authenticated;

-- ── tariffs: everyone signed-in may read the ACTIVE tariff ──
create policy "tariffs read active"
  on public.tariffs for select to authenticated
  using (active);

revoke insert, update, delete on public.tariffs from authenticated;

-- ── meters: read own · rename own · nothing else ────────────
create policy "meters read own"
  on public.meters for select to authenticated
  using (user_id = auth.uid());

create policy "meters rename own"
  on public.meters for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke insert, update, delete on public.meters from authenticated;
grant update (nickname) on public.meters to authenticated;

-- ── payments / purchases / credits / transactions: read own ─
-- No client write path exists on any of these. The purchase
-- function is the ONLY door, and it is not built of policies.
create policy "payments read own"
  on public.payments for select to authenticated
  using (user_id = auth.uid());

create policy "purchases read own"
  on public.electricity_purchases for select to authenticated
  using (user_id = auth.uid());

create policy "credits read own"
  on public.meter_credits for select to authenticated
  using (exists (
    select 1 from public.meters m
    where m.id = meter_id and m.user_id = auth.uid()
  ));

create policy "transactions read own"
  on public.transactions for select to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on public.payments               from authenticated;
revoke insert, update, delete on public.electricity_purchases  from authenticated;
revoke insert, update, delete on public.meter_credits          from authenticated;
revoke insert, update, delete on public.transactions           from authenticated;

-- ── meter_readings: read own meters' telemetry ──────────────
-- Writes arrive in Phase 2 from the simulator, never from users.
create policy "readings read own meters"
  on public.meter_readings for select to authenticated
  using (exists (
    select 1 from public.meters m
    where m.id = meter_id and m.user_id = auth.uid()
  ));

revoke insert, update, delete on public.meter_readings from authenticated;

-- ── audit_logs: NO policies. Clients never read the audit trail.
revoke all on public.audit_logs from authenticated;

-- ── notifications: read own · mark-as-read only ─────────────
create policy "notifications read own"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "notifications update own"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke insert, update, delete on public.notifications from authenticated;
grant update (read) on public.notifications to authenticated;
