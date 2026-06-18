-- Base schema: shops and app_users
-- Run in Supabase SQL editor or via migrations

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  email text,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  role text default 'staff' check (role in ('super_admin', 'staff', 'shop_manager')),
  shop_id uuid references public.shops(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists app_users_user_id_idx on public.app_users(user_id);

alter table public.app_users enable row level security;
alter table public.shops enable row level security;

create policy "app_users_select_own" on public.app_users
  for select using (auth.uid() = user_id);

-- Server uses service_role; policies apply to direct client access only
create policy "shops_select_auth" on public.shops
  for select using (
    exists (
      select 1 from public.app_users au
      where au.user_id = auth.uid() and au.role = 'super_admin'
    )
  );

-- Seed note: first login as admin@gmail.com creates super_admin via API register handler
