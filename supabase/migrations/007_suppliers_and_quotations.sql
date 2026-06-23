-- Migration 007: Suppliers schema update + Products model_name + Quotations enhancements
-- Run this in your Supabase SQL Editor.

-- ============================================================
-- SUPPLIERS TABLE: rename name→company_name, drop email
-- ============================================================

-- If the suppliers table doesn't exist yet, create it fresh:
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  company_name text not null,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- If it already existed with a 'name' column, rename it:
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'suppliers'
      and column_name = 'name'
  ) then
    alter table public.suppliers rename column name to company_name;
  end if;
end
$$;

-- Drop email column if it exists:
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'suppliers'
      and column_name = 'email'
  ) then
    alter table public.suppliers drop column email;
  end if;
end
$$;

-- Drop contact_name column if it exists (not in spec):
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'suppliers'
      and column_name = 'contact_name'
  ) then
    alter table public.suppliers drop column contact_name;
  end if;
end
$$;

-- Ensure updated_at exists:
alter table public.suppliers
  add column if not exists updated_at timestamptz default now();

alter table public.suppliers enable row level security;

-- ============================================================
-- PRODUCTS TABLE: add model_name column
-- ============================================================
alter table public.products
  add column if not exists model_name text;

-- ============================================================
-- QUOTATIONS TABLE: add customer_name + notes columns
-- ============================================================
alter table public.quotations
  add column if not exists customer_name text,
  add column if not exists notes text,
  add column if not exists total numeric(12, 2) default 0;

-- ============================================================
-- PURCHASES TABLE: add model_name tracking to purchase_items
-- ============================================================
-- purchase_items already has product_id; product has model_name now
-- No changes needed to purchase_items structure

-- Ensure purchases table has required columns (may vary by install)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  total_amount numeric(12, 2) not null default 0,
  status text default 'received' check (status in ('pending', 'received', 'cancelled')),
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null,
  unit_cost numeric(12, 2) not null,
  subtotal numeric(12, 2) not null
);

alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;

-- ============================================================
-- CUSTOMERS TABLE (if missing)
-- ============================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  created_at timestamptz default now()
);
alter table public.customers enable row level security;

-- Add customer_id to sales if missing:
alter table public.sales
  add column if not exists customer_id uuid references public.customers(id) on delete set null;
