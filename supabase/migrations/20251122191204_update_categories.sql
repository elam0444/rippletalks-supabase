-- ============================================
-- MIGRATION: Convert relationship_category ENUM → Table
-- ============================================

-- 1. Create NEW table for relationship categories
CREATE TABLE relationship_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Insert previous ENUM values into the new table
INSERT INTO relationship_categories (name, description)
VALUES 
  ('Prospect', 'Previously enum value'),
  ('Channel Partner', 'Previously enum value'),
  ('Influencer', 'Previously enum value');

-- 3. Add new FK column to target_companies
ALTER TABLE target_companies
ADD COLUMN relationship_category_id uuid REFERENCES relationship_categories(id);

-- 4. Backfill relationship_category_id based on old ENUM column
UPDATE target_companies tc
SET relationship_category_id = rc.id
FROM relationship_categories rc
WHERE rc.name = tc.relationship_category::text;

-- 5. Make new column NOT NULL after backfill
ALTER TABLE target_companies
ALTER COLUMN relationship_category_id SET NOT NULL;

-- 6. Drop old ENUM column
ALTER TABLE target_companies
DROP COLUMN relationship_category;

-- 7. Drop ENUM type
DROP TYPE relationship_category;

-- 8. (Optional) Rename new column to old name for compatibility
ALTER TABLE target_companies
RENAME COLUMN relationship_category_id TO relationship_category;

-- ============================================
-- SAMPLE DATA FIXES (Companies now need category_id FK)
-- ============================================

-- Ensure companies have valid categories
UPDATE companies c
SET category_id = cat.id
FROM categories cat
WHERE cat.name = 'Enterprise' AND c.name = 'Meta';

UPDATE companies c
SET category_id = cat.id
FROM categories cat
WHERE cat.name = 'Enterprise' AND c.name = 'Apple';

UPDATE companies c
SET category_id = cat.id
FROM categories cat
WHERE cat.name = 'Enterprise' AND c.name = 'Google';

UPDATE companies c
SET category_id = cat.id
FROM categories cat
WHERE cat.name = 'Enterprise' AND c.name = 'Netflix';

UPDATE companies c
SET category_id = cat.id
FROM categories cat
WHERE cat.name = 'Finance' AND c.name = 'JP Morgan';

-- ============================================
-- Fix sample data for target_companies (relationship category now FK)
-- ============================================

-- Update sample data to match new FK
UPDATE target_companies tc
SET relationship_category = rc.id
FROM relationship_categories rc
WHERE 
  (tc.why LIKE '%collaboration%') AND rc.name = 'Prospect';

UPDATE target_companies tc
SET relationship_category = rc.id
FROM relationship_categories rc
WHERE 
  (tc.why LIKE '%Safari%') AND rc.name = 'Channel Partner';

UPDATE target_companies tc
SET relationship_category = rc.id
FROM relationship_categories rc
WHERE 
  (tc.why LIKE '%Cloud%') AND rc.name = 'Influencer';

UPDATE target_companies tc
SET relationship_category = rc.id
FROM relationship_categories rc
WHERE 
  (tc.why LIKE '%Content distribution%') AND rc.name = 'Prospect';

UPDATE target_companies tc
SET relationship_category = rc.id
FROM relationship_categories rc
WHERE 
  (tc.why LIKE '%Credit card%') AND rc.name = 'Channel Partner';
