-- Jalankan seluruh script ini di Supabase Dashboard > SQL Editor > New Query > Run

create table if not exists kas_data (
  id int primary key,
  settings jsonb not null default '{}'::jsonb,
  members jsonb not null default '[]'::jsonb,
  transactions jsonb not null default '[]'::jsonb,
  budgets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- baris tunggal tempat semua data kas kelas disimpan
insert into kas_data (id, settings, members, transactions, budgets)
values (1, '{}'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;

-- aktifkan Row Level Security lalu izinkan baca & tulis publik
-- (cukup aman untuk aplikasi kas kelas skala kecil; PIN admin tetap
-- melindungi fitur edit di sisi UI aplikasi)
alter table kas_data enable row level security;

drop policy if exists "public read kas_data" on kas_data;
create policy "public read kas_data" on kas_data
  for select using (true);

drop policy if exists "public update kas_data" on kas_data;
create policy "public update kas_data" on kas_data
  for update using (true) with check (true);

drop policy if exists "public insert kas_data" on kas_data;
create policy "public insert kas_data" on kas_data
  for insert with check (true);

-- aktifkan realtime supaya perubahan data langsung muncul di semua browser
alter publication supabase_realtime add table kas_data;
