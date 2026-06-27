-- Migration 014: add paid_amount columns to purchases and sales

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2) DEFAULT 0;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2) DEFAULT 0;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
