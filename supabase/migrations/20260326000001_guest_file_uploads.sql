-- ============================================
-- Guest file uploads table
-- Stores metadata for raw guest list files
-- uploaded via share links (CSV/XLS/XLSX)
-- ============================================

CREATE TABLE IF NOT EXISTS guest_file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id uuid REFERENCES share_links(id) ON DELETE CASCADE,
  client_company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size int,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guest_file_uploads_share_link_idx ON guest_file_uploads (share_link_id);
CREATE INDEX IF NOT EXISTS guest_file_uploads_company_idx ON guest_file_uploads (client_company_id);
