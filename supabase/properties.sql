-- Real Estate shared world — run this in the Supabase SQL editor.
-- One row per owned property. asset_id is the PRIMARY KEY, so two players
-- can never own the same building: the second INSERT fails (race-safe).

create table if not exists properties (
  asset_id            text primary key,
  owner_id            uuid not null references players(id) on delete cascade,
  owner_name          text,
  purchased_at        timestamptz not null default now(),
  purchase_price      numeric not null,
  mortgage            jsonb,
  last_collected_month integer,
  last_settled_month  integer
);

alter table properties enable row level security;

create policy "properties are public to read"
  on properties for select using (true);

create policy "buy as yourself"
  on properties for insert with check (auth.uid() = owner_id);

create policy "manage your own properties"
  on properties for update using (auth.uid() = owner_id);

create policy "sell your own properties"
  on properties for delete using (auth.uid() = owner_id);
