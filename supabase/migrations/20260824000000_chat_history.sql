-- ============================================================
-- ZimSmartMeter · assistant chat history
-- Conversations belong to the user; messages belong to the
-- conversation. Users may create and rename their own threads
-- and delete them; messages are written by the assistant edge
-- function (service role) so the transcript can't be forged
-- from a browser.
-- ============================================================

create table public.chat_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chat_conversations_user_idx
  on public.chat_conversations (user_id, updated_at desc);

create table public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

create index chat_messages_convo_idx
  on public.chat_messages (conversation_id, created_at);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages      enable row level security;

create policy "conversations read own" on public.chat_conversations
  for select to authenticated using (user_id = auth.uid());
create policy "conversations create own" on public.chat_conversations
  for insert to authenticated with check (user_id = auth.uid());
create policy "conversations rename own" on public.chat_conversations
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "conversations delete own" on public.chat_conversations
  for delete to authenticated using (user_id = auth.uid());

create policy "messages read own" on public.chat_messages
  for select to authenticated using (user_id = auth.uid());

-- Titles are the only column a client may rewrite; transcripts are
-- append-only and written server-side.
revoke update on public.chat_conversations from authenticated;
grant  update (title) on public.chat_conversations to authenticated;
revoke insert, update, delete on public.chat_messages from authenticated;
