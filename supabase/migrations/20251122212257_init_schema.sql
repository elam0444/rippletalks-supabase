-- ============================================
-- Enable UUID generation
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. Lookup tables
-- ============================================
CREATE TABLE IF NOT EXISTS profile_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO profile_roles (name, description)
VALUES 
  ('admin', 'Full access to the account and upload features'),
  ('viewer', 'Can view and select curated items (CEO / viewer role)')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS relationship_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO relationship_categories (name, description)
VALUES
 ('Prospect', 'Potential future customer'),
 ('Channel Partner', 'Partner for distribution or sales'),
 ('Influencer', 'Person or company with influence over decisions')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. Industries
-- ============================================
CREATE TABLE IF NOT EXISTS industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO industries (name, description)
VALUES
  ('Technology', 'Software, platforms, dev tools'),
  ('Finance', 'Banks, payment companies, fintech'),
  ('Healthcare', 'Hospitals, medtech, pharmaceuticals'),
  ('Retail', 'Ecommerce and physical retail'),
  ('Media', 'Publishers, streaming, content companies')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. Companies (without added_by_profile_id FK yet)
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  added_by_profile_id uuid, -- FK will be added later
  name text NOT NULL,
  legal_name text,
  slug text UNIQUE,
  website text,
  logo_url text,
  description text,
  industry_id uuid REFERENCES industries(id) ON DELETE SET NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS companies_name_unique_idx
  ON companies (lower(name));

-- ============================================
-- 4. Profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  full_name text,
  role_id uuid REFERENCES profile_roles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_company_idx ON profiles (company_id);

-- ============================================
-- 5. Add FK for companies.added_by_profile_id now that profiles exist
-- ============================================
ALTER TABLE companies
ADD CONSTRAINT companies_added_by_profile_fk
FOREIGN KEY (added_by_profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================
-- 6. Contacts
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  email text,
  name text,
  title text,
  phone text,
  avatar_url text,
  added_by_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts (lower(email));
CREATE INDEX IF NOT EXISTS contacts_company_idx ON contacts (company_id);

-- ============================================
-- 7. Target Companies
-- ============================================
CREATE TABLE IF NOT EXISTS target_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  target_company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  added_by_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  relationship_category uuid NOT NULL REFERENCES relationship_categories(id),
  why text,
  note text,
  tags text[],
  selected boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS target_companies_unique_idx
  ON target_companies (client_company_id, target_company_id);

-- ============================================
-- 8. Shareable Links
-- ============================================
CREATE TABLE IF NOT EXISTS share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  link_token text NOT NULL UNIQUE,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  allowed_target_company_ids uuid[],
  expires_at timestamptz,
  max_uses int,
  uses int DEFAULT 0,
  notes text,
  revoked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS share_links_company_idx ON share_links (company_id);
CREATE INDEX IF NOT EXISTS share_links_expires_idx ON share_links (expires_at);

-- ============================================
-- 9. Share Link Logs
-- ============================================
CREATE TABLE IF NOT EXISTS share_link_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id uuid REFERENCES share_links(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip inet,
  user_agent text,
  event text NOT NULL DEFAULT 'open'
);

CREATE INDEX IF NOT EXISTS share_link_logs_by_link_idx ON share_link_logs (share_link_id);

-- ============================================
-- 10. Activity Logs
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_actor_idx ON activity_logs (actor_profile_id);

-- ============================================
-- 11. Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_target_companies_updated_at
  BEFORE UPDATE ON target_companies
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_share_links_updated_at
  BEFORE UPDATE ON share_links
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 12. Extra Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS companies_deleted_at_idx ON companies (deleted_at);
CREATE INDEX IF NOT EXISTS target_companies_client_target_idx ON target_companies (client_company_id, target_company_id);

-- ============================================
-- DONE
-- ============================================
