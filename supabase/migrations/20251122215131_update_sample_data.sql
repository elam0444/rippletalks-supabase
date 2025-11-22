-- ============================================
-- 0. Alter profile_roles to include company_id
-- ============================================
ALTER TABLE profile_roles
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE CASCADE;

-- ============================================
-- 1. Ensure companies name is unique (PostgreSQL-safe)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'companies_name_unique'
    ) THEN
        EXECUTE 'ALTER TABLE companies ADD CONSTRAINT companies_name_unique UNIQUE (name)';
    END IF;
END$$;

-- ============================================
-- 2. Ensure contacts email is unique (PostgreSQL-safe)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'contacts_email_unique'
    ) THEN
        EXECUTE 'ALTER TABLE contacts ADD CONSTRAINT contacts_email_unique UNIQUE (email)';
    END IF;
END$$;

-- ============================================
-- 3. Seed lookup tables (if not exists)
-- ============================================

-- Profile roles
INSERT INTO profile_roles (id, name, created_at)
SELECT gen_random_uuid(), name, now()
FROM (VALUES ('admin'), ('viewer')) AS r(name)
ON CONFLICT (name) DO NOTHING;

-- Industries
INSERT INTO industries (id, name, created_at)
SELECT gen_random_uuid(), name, now()
FROM (VALUES ('Technology')) AS i(name)
ON CONFLICT (name) DO NOTHING;

-- Relationship categories
INSERT INTO relationship_categories (id, name, created_at)
SELECT gen_random_uuid(), name, now()
FROM (VALUES ('Prospect'), ('Channel Partner'), ('Influencer')) AS rc(name)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 4. Companies
-- ============================================
INSERT INTO companies (id, name, legal_name, slug, website, description, industry_id, created_at)
SELECT
  gen_random_uuid(),
  c.name,
  c.legal_name,
  c.slug,
  c.website,
  c.description,
  i.id,
  now()
FROM (VALUES
  ('Apple', 'Apple Inc.', 'apple', 'https://apple.com', 'Tech company'),
  ('Meta', 'Meta Platforms, Inc.', 'meta', 'https://meta.com', 'Social media & VR'),
  ('Google', 'Google LLC', 'google', 'https://google.com', 'Search & ads'),
  ('Amazon', 'Amazon.com, Inc.', 'amazon', 'https://amazon.com', 'Ecommerce & cloud'),
  ('Tesla', 'Tesla, Inc.', 'tesla', 'https://tesla.com', 'Electric cars')
) AS c(name, legal_name, slug, website, description)
CROSS JOIN LATERAL (SELECT id FROM industries WHERE name='Technology' LIMIT 1) i
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 5. Profiles
-- ============================================
INSERT INTO profiles (id, full_name, role_id, company_id, created_at)
SELECT
  u.id::uuid,
  u.full_name,
  r.id,
  co.id,
  now()
FROM (VALUES
  ('77ea55e8-dcd5-425c-a277-7e935216d922', 'Alice Admin'),
  ('c9a39ee3-df0b-4ef9-b4ca-efb76b0a0173', 'Bob Viewer')
) AS u(id, full_name)
JOIN profile_roles r ON r.name = CASE WHEN u.full_name LIKE '%Admin%' THEN 'admin' ELSE 'viewer' END
CROSS JOIN LATERAL (SELECT id FROM companies WHERE name='Apple' LIMIT 1) co
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. Contacts
-- ============================================
INSERT INTO contacts (id, company_id, name, email, title, added_by_profile_id, created_at)
SELECT
  gen_random_uuid(),
  co.id,
  c.contact_name,
  c.email,
  c.title,
  a.id,
  now()
FROM (VALUES
  ('Tim Cook', 'tim@apple.com', 'CEO', 'Apple'),
  ('Mark Zuckerberg', 'mark@meta.com', 'CEO', 'Meta'),
  ('Sundar Pichai', 'sundar@google.com', 'CEO', 'Google'),
  ('Jeff Bezos', 'jeff@amazon.com', 'Founder', 'Amazon'),
  ('Elon Musk', 'elon@tesla.com', 'CEO', 'Tesla')
) AS c(contact_name, email, title, company_name)
JOIN companies co ON co.name = c.company_name
CROSS JOIN LATERAL (SELECT id FROM profiles WHERE full_name='Alice Admin' LIMIT 1) a
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 7. Target Companies
-- ============================================
INSERT INTO target_companies (id, profile_id, client_company_id, target_company_id, added_by_profile_id, relationship_category, why, note, tags, created_at)
SELECT
  gen_random_uuid(),
  v.id,
  aco.id,
  t.id,
  a.id,
  rc.id,
  CASE t.name
    WHEN 'Apple' THEN 'Leader in consumer electronics'
    WHEN 'Meta' THEN 'Strong in social media & VR'
    WHEN 'Google' THEN 'Top search engine & ads platform'
    ELSE 'Curated by Admin'
  END AS why,
  'Sample note',
  ARRAY['demo','seed'],
  now()
FROM profiles v
JOIN profiles a ON a.full_name='Alice Admin'
JOIN profiles v2 ON v2.full_name='Bob Viewer' AND v.id = v2.id
JOIN companies aco ON aco.name='Apple'
JOIN companies t ON t.name IN ('Apple','Meta','Google')
JOIN relationship_categories rc ON rc.name = CASE t.name WHEN 'Apple' THEN 'Prospect' WHEN 'Meta' THEN 'Channel Partner' WHEN 'Google' THEN 'Influencer' END
WHERE v.full_name='Bob Viewer';
