-- ============================================
-- Add target customer profile and preferred
-- relationship categories to companies table
-- ============================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS target_customer_profile text,
  ADD COLUMN IF NOT EXISTS preferred_relationship_categories uuid[] NOT NULL DEFAULT '{}';