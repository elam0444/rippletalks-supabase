-- ============================================
-- Migration: Add "interested" flag to target_companies
-- Version: 20251122XXXXXX_add_interested_flag.sql
-- ============================================

ALTER TABLE target_companies
ADD COLUMN IF NOT EXISTS interested boolean DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN target_companies.interested IS 'Indicates if the user wants to collaborate/work with this company';
