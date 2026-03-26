-- ============================================
-- Analytics tracking improvements
-- ============================================

-- 1. Add source column to target_companies
--    Values: 'manual' | 'csv' | 'guest' | 'ai'
ALTER TABLE target_companies
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

-- 2. Create csv_uploads table to track upload events
CREATE TABLE IF NOT EXISTS csv_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  client_company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  file_name text,
  total_rows int NOT NULL DEFAULT 0,
  success_count int NOT NULL DEFAULT 0,
  failure_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS csv_uploads_profile_idx ON csv_uploads (profile_id);
CREATE INDEX IF NOT EXISTS csv_uploads_company_idx ON csv_uploads (client_company_id);
CREATE INDEX IF NOT EXISTS csv_uploads_created_at_idx ON csv_uploads (created_at);

-- 3. Index share_link_logs timestamp for range queries
CREATE INDEX IF NOT EXISTS share_link_logs_timestamp_idx ON share_link_logs (timestamp);
