-- ============================================
-- ShipTrack — Supabase Database Schema
-- ============================================
-- Run this in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New Query → paste all → Run)
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.

-- ----------------------------------------------------
-- 1. shipments — the core record
-- ----------------------------------------------------
create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_number text unique not null,

  courier text,

  sender_name text not null,
  sender_email text,
  sender_phone text,

  receiver_name text not null,
  receiver_email text,
  receiver_phone text,

  origin text not null,
  origin_lat double precision,
  origin_lng double precision,
  destination text not null,
  destination_lat double precision,
  destination_lng double precision,

  shipment_type text not null check (
    shipment_type in ('Air Freight', 'Ocean Freight', 'Road Freight', 'Rail Freight', 'Reverse Freight')
  ),
  quantity integer default 1,
  is_fragile boolean default false,
  is_express boolean default false,
  progress_speed text not null default 'medium' check (
    progress_speed in ('slow', 'medium', 'fast')
  ),
  description text,

  created_at timestamptz not null default now(),
  estimated_delivery timestamptz not null,

  status text not null default 'packaging' check (
    status in ('packaging', 'queued', 'in transit', 'customs', 'on hold', 'delivered')
  ),
  is_on_hold boolean default false,
  held_at timestamptz,
  total_held_seconds integer not null default 0,

  payment_status text default 'pending' check (
    payment_status in ('pending', 'paid')
  ),
  amount_to_pay numeric(12,2),
  payment_method text,
  payment_reason text
);

create index if not exists idx_shipments_tracking_number on shipments (tracking_number);

-- ----------------------------------------------------
-- 2. shipment_images — up to 5 per shipment
-- ----------------------------------------------------
create table if not exists shipment_images (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  url text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_shipment_images_shipment_id on shipment_images (shipment_id);

-- ----------------------------------------------------
-- 3. shipment_status_history — audit trail of status changes
-- ----------------------------------------------------
create table if not exists shipment_status_history (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  status text not null,
  changed_at timestamptz not null default now(),
  note text
);

create index if not exists idx_status_history_shipment_id on shipment_status_history (shipment_id);

-- ----------------------------------------------------
-- 4. shipment_updates — manual update timeline entries
-- ----------------------------------------------------
create table if not exists shipment_updates (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  message text not null,
  update_time timestamptz not null default now()
);

create index if not exists idx_shipment_updates_shipment_id on shipment_updates (shipment_id);

-- ----------------------------------------------------
-- 5. geocode_cache — avoid re-hitting Nominatim for repeat place names
-- ----------------------------------------------------
create table if not exists geocode_cache (
  query text primary key,
  lat double precision not null,
  lng double precision not null,
  cached_at timestamptz not null default now()
);

-- ----------------------------------------------------
-- 5. Row Level Security
-- ----------------------------------------------------
-- Public (anon key): read-only on shipments/images/history, no access to
-- writing anything. Admin writes go through a server-side route using the
-- service role key (bypasses RLS), gated by the shared admin password —
-- so the anon key the browser holds can never create/edit/delete.

alter table shipments enable row level security;
alter table shipment_images enable row level security;
alter table shipment_status_history enable row level security;
alter table geocode_cache enable row level security;

drop policy if exists "Public can read shipments" on shipments;
create policy "Public can read shipments"
  on shipments for select
  using (true);

drop policy if exists "Public can read shipment images" on shipment_images;
create policy "Public can read shipment images"
  on shipment_images for select
  using (true);

drop policy if exists "Public can read status history" on shipment_status_history;
create policy "Public can read status history"
  on shipment_status_history for select
  using (true);

-- geocode_cache has no public policy at all — it's an internal
-- implementation detail, not something the tracker page needs to read.

-- ----------------------------------------------------
-- 6. Storage bucket for shipment images
-- ----------------------------------------------------
insert into storage.buckets (id, name, public)
values ('shipment-images', 'shipment-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view shipment images" on storage.objects;
create policy "Public can view shipment images"
  on storage.objects for select
  using (bucket_id = 'shipment-images');
