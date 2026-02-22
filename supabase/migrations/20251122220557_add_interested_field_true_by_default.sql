-- ============================================
-- Migration: Add "interested" flag to target_companies
-- Version: 20251122XXXXXX_add_interested_flag.sql
-- ============================================

-- 1. Add the new column
ALTER TABLE target_companies
ADD COLUMN IF NOT EXISTS interested boolean DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN target_companies.interested IS 'Indicates if the user wants to collaborate/work with this company';

-- 2. Set the flag to TRUE for existing rows (example: all rows for demonstration)
UPDATE target_companies
SET interested = TRUE
WHERE id IS NOT NULL; -- or use a more specific condition if needed
