-- Additive migration; apply on staging before production.
create table if not exists public.profile_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('note','goal_progress','outreach_draft','outreach_manual_sent')),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 20000),
  goal_ref text,
  source text not null default 'web' check (source in ('web','chatgpt')),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  unique(user_id, request_id)
);
alter table public.profile_activity enable row level security;
revoke all on public.profile_activity from anon;
grant select, insert, delete on public.profile_activity to authenticated;
create policy "activity_read_own" on public.profile_activity for select to authenticated using (auth.uid() = user_id);
create policy "activity_insert_own" on public.profile_activity for insert to authenticated with check (auth.uid() = user_id);
create policy "activity_delete_own" on public.profile_activity for delete to authenticated using (auth.uid() = user_id);
create index if not exists profile_activity_owner_time on public.profile_activity(user_id, created_at desc);
