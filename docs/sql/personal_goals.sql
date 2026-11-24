-- Apply to Supabase before enabling the goals page.
create table if not exists public.personal_goals (
 user_id uuid primary key references auth.users(id) on delete cascade,
 values jsonb not null default '{}'::jsonb check (jsonb_typeof(values) = 'object'),
 updated_at timestamptz not null default now()
);
alter table public.personal_goals enable row level security;
revoke all on public.personal_goals from anon;
grant select, insert, update on public.personal_goals to authenticated;
create policy personal_goals_select on public.personal_goals for select to authenticated using (auth.uid() = user_id);
create policy personal_goals_insert on public.personal_goals for insert to authenticated with check (auth.uid() = user_id);
create policy personal_goals_update on public.personal_goals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
