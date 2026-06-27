-- Migration 013: Ledger table and current_balance columns for parties

-- Add current_balance to suppliers and customers
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS current_balance numeric(12,2) DEFAULT 0;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS current_balance numeric(12,2) DEFAULT 0;

-- Create ledger_transactions table to record supplier/customer ledger entries
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  party_type text NOT NULL CHECK (party_type IN ('supplier','customer')),
  party_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL,
  direction text NOT NULL CHECK (direction IN ('debit','credit')),
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
