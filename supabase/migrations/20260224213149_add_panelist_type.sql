-- ============================================
-- Migration: Add panelist_type to contacts
-- Version: 20260224213149_add_panelist_type.sql
-- ============================================

-- 1. Create panelist_types table
CREATE TABLE IF NOT EXISTS public.panelist_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.panelist_types IS 'Stores available panelist role types for contacts';
COMMENT ON COLUMN public.panelist_types.name IS 'Display name of the panelist type';


-- 2. Insert predefined panelist types
INSERT INTO public.panelist_types (name)
VALUES
  ('Special Guest'),
  ('VIP Co-Host'),
  ('Guest Co-Host'),
  ('VIP Guest'),
  ('Guest'),
  ('Guest Co-Host & Partner')
ON CONFLICT (name) DO NOTHING;


-- 3. Add panelist_type_id column to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS panelist_type_id uuid;

COMMENT ON COLUMN public.contacts.panelist_type_id IS 'References the panelist type assigned to this contact';


-- 4. Add foreign key constraint
ALTER TABLE public.contacts
ADD CONSTRAINT contacts_panelist_type_id_fkey
FOREIGN KEY (panelist_type_id)
REFERENCES public.panelist_types (id)
ON DELETE SET NULL;