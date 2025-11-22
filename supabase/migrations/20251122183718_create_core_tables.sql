-- ============================================
-- Enable UUID generation
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. ENUM Types
-- ============================================
CREATE TYPE contact_role AS ENUM ('admin', 'viewer');
CREATE TYPE relationship_category AS ENUM ('Prospect','Channel Partner','Influencer');

-- ============================================
-- 2. Core Tables
-- ============================================

-- Industries
CREATE TABLE IF NOT EXISTS industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Companies (soft delete)
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  slug text UNIQUE,
  website text,
  logo_url text,
  description text,
  industry_id uuid REFERENCES industries(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS companies_name_unique_idx
  ON companies (lower(name));

-- Contacts (replaces profiles)
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid text UNIQUE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text,
  title text,
  role contact_role NOT NULL DEFAULT 'viewer',
  phone text,
  avatar_url text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS contacts_email_idx
  ON contacts (lower(email));

-- ============================================
-- 3. Target Companies Mapping (A → B)
-- ============================================
CREATE TABLE IF NOT EXISTS target_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  target_company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  added_by_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  relationship_category relationship_category NOT NULL DEFAULT 'Prospect',
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

CREATE INDEX IF NOT EXISTS target_companies_client_idx
  ON target_companies (client_company_id);

CREATE INDEX IF NOT EXISTS target_companies_target_idx
  ON target_companies (target_company_id);

-- ============================================
-- 4. Shareable Links
-- ============================================
CREATE TABLE IF NOT EXISTS share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  link_token text NOT NULL UNIQUE,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  allowed_target_company_ids uuid[],
  expires_at timestamptz,
  max_uses int,
  uses int DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS share_links_company_idx
  ON share_links (company_id);

CREATE INDEX IF NOT EXISTS share_links_expires_idx
  ON share_links (expires_at);

-- ============================================
-- 5. Share Link Logs
-- ============================================
CREATE TABLE IF NOT EXISTS share_link_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id uuid REFERENCES share_links(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip inet,
  user_agent text,
  event text NOT NULL DEFAULT 'open'
);

CREATE INDEX IF NOT EXISTS share_link_logs_by_link_idx
  ON share_link_logs (share_link_id);

CREATE INDEX IF NOT EXISTS share_link_logs_timestamp_idx
  ON share_link_logs (timestamp);

-- ============================================
-- 6. Activity Logs
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_actor_idx
  ON activity_logs (actor_contact_id);

CREATE INDEX IF NOT EXISTS activity_logs_action_idx
  ON activity_logs (action);

-- ============================================
-- 7. Triggers
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
-- 8. Helper Functions
-- ============================================
CREATE OR REPLACE FUNCTION share_link_is_active(p_share_link_id uuid)
RETURNS boolean AS $$
DECLARE
  l share_links%ROWTYPE;
BEGIN
  SELECT * INTO l FROM share_links WHERE id = p_share_link_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF l.revoked THEN RETURN false; END IF;
  IF l.expires_at IS NOT NULL AND l.expires_at < now() THEN RETURN false; END IF;
  IF l.max_uses IS NOT NULL AND l.uses >= l.max_uses THEN RETURN false; END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 9. Extra Performance Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS companies_deleted_at_idx ON companies (deleted_at);
CREATE INDEX IF NOT EXISTS contacts_company_idx ON contacts (company_id);
CREATE INDEX IF NOT EXISTS target_companies_client_target_idx ON target_companies (client_company_id, target_company_id);

-- ============================================
-- DONE
-- ============================================
