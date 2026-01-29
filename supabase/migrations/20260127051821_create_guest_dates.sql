-- Create contact_available_dates table
CREATE TABLE IF NOT EXISTS contact_available_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  available_date TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_available_dates_contact_id 
  ON contact_available_dates(contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_available_dates_company_id 
  ON contact_available_dates(company_id);

CREATE INDEX IF NOT EXISTS idx_contact_available_dates_date 
  ON contact_available_dates(available_date);

CREATE INDEX IF NOT EXISTS idx_contact_available_dates_contact_company 
  ON contact_available_dates(contact_id, company_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_contact_available_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_available_dates_updated_at
BEFORE UPDATE ON contact_available_dates
FOR EACH ROW
EXECUTE FUNCTION update_contact_available_dates_updated_at();

-- Trigger to auto-set created_by (optional)
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_created_by
BEFORE INSERT ON contact_available_dates
FOR EACH ROW
EXECUTE FUNCTION set_created_by();

-- Enable RLS
ALTER TABLE contact_available_dates ENABLE ROW LEVEL SECURITY;

-- Policies: allow all actions for everyone
CREATE POLICY "allow_all_actions"
  ON contact_available_dates
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE contact_available_dates IS 'Stores available meeting dates for contacts (fully open access)';