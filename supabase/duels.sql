-- 1v1 portfolio duels — run this in the Supabase SQL editor.

create table if not exists duels (
  id                      uuid primary key default gen_random_uuid(),
  challenger_id           uuid not null references players(id) on delete cascade,
  challenger_name         text,
  opponent_id             uuid not null references players(id) on delete cascade,
  opponent_name           text,
  start_value_challenger  numeric,
  start_value_opponent    numeric,
  created_at              timestamptz not null default now(),
  start_at                timestamptz,
  ends_at                 timestamptz,
  status                  text not null default 'pending', -- pending | active | declined | settled
  winner_id               uuid
);

alter table duels enable row level security;

create policy "participants can read their duels"
  on duels for select using (auth.uid() = challenger_id or auth.uid() = opponent_id);

create policy "challenge as yourself"
  on duels for insert with check (auth.uid() = challenger_id);

create policy "participants can update their duels"
  on duels for update using (auth.uid() = challenger_id or auth.uid() = opponent_id);
