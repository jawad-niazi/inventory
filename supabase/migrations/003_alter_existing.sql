-- Apply on existing databases that already have app_users/shops from earlier schema

alter table public.app_users
  add column if not exists updated_at timestamptz default now();

-- Relax role constraint if old schema had no check (safe no-op on new installs)
-- alter table public.app_users drop constraint if exists app_users_role_check;
-- alter table public.app_users add constraint app_users_role_check
--   check (role in ('super_admin', 'staff', 'shop_manager'));
