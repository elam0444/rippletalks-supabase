-- ============================================
-- SAMPLE DATA INSERTS (NO CTEs — MIGRATION SAFE)
-- ============================================

-- 1. Industries
INSERT INTO industries (id, name, description)
VALUES
  (gen_random_uuid(), 'Technology', 'Tech and software companies'),
  (gen_random_uuid(), 'Finance', 'Banking and financial services'),
  (gen_random_uuid(), 'Healthcare', 'Medical and biotech companies'),
  (gen_random_uuid(), 'Retail', 'Retail and e-commerce'),
  (gen_random_uuid(), 'Entertainment', 'Media and entertainment businesses');

-- 2. Categories
INSERT INTO categories (id, name, description)
VALUES
  (gen_random_uuid(), 'Startup', 'Early stage companies'),
  (gen_random_uuid(), 'Enterprise', 'Large global businesses'),
  (gen_random_uuid(), 'SMB', 'Small and medium businesses'),
  (gen_random_uuid(), 'Nonprofit', 'Non-governmental organizations'),
  (gen_random_uuid(), 'Government', 'Public sector entities');

-- 3. Companies
INSERT INTO companies (id, name, legal_name, slug, website, description)
VALUES
  (gen_random_uuid(), 'Meta', 'Meta Platforms, Inc.', 'meta', 'https://meta.com', 'Social technology company'),
  (gen_random_uuid(), 'Apple', 'Apple Inc.', 'apple', 'https://apple.com', 'Consumer electronics'),
  (gen_random_uuid(), 'Google', 'Google LLC', 'google', 'https://google.com', 'Search and cloud technology'),
  (gen_random_uuid(), 'Netflix', 'Netflix Inc.', 'netflix', 'https://netflix.com', 'Streaming entertainment'),
  (gen_random_uuid(), 'JP Morgan', 'JP Morgan Chase & Co.', 'jpmorgan', 'https://jpmorganchase.com', 'Global financial services');

-- 4. Contacts
INSERT INTO contacts (id, auth_uid, company_id, email, name, title, role)
VALUES
  (gen_random_uuid(), 'auth1', (SELECT id FROM companies WHERE name='Meta'), 'zuck@meta.com', 'Mark Zuckerberg', 'CEO', 'admin'),
  (gen_random_uuid(), 'auth2', (SELECT id FROM companies WHERE name='Apple'), 'tim@apple.com', 'Tim Cook', 'CEO', 'admin'),
  (gen_random_uuid(), 'auth3', (SELECT id FROM companies WHERE name='Google'), 'sundar@google.com', 'Sundar Pichai', 'CEO', 'viewer'),
  (gen_random_uuid(), 'auth4', (SELECT id FROM companies WHERE name='Netflix'), 'reed@netflix.com', 'Reed Hastings', 'Chairman', 'viewer'),
  (gen_random_uuid(), 'auth5', (SELECT id FROM companies WHERE name='JP Morgan'), 'jamie@jpmorgan.com', 'Jamie Dimon', 'CEO', 'admin');

-- 5. Target Companies
INSERT INTO target_companies
(id, client_company_id, target_company_id, added_by_contact_id, relationship_category, why, tags)
VALUES
  (gen_random_uuid(),
    (SELECT id FROM companies WHERE name='Meta'),
    (SELECT id FROM companies WHERE name='Apple'),
    (SELECT id FROM contacts WHERE email='zuck@meta.com'),
    'Prospect',
    'Meta wants collaboration on AR devices',
    ARRAY['AR','hardware']
  ),
  (gen_random_uuid(),
    (SELECT id FROM companies WHERE name='Apple'),
    (SELECT id FROM companies WHERE name='Google'),
    (SELECT id FROM contacts WHERE email='tim@apple.com'),
    'Channel Partner',
    'Better Search + Safari integrations',
    ARRAY['browser','search']
  ),
  (gen_random_uuid(),
    (SELECT id FROM companies WHERE name='Google'),
    (SELECT id FROM companies WHERE name='Netflix'),
    (SELECT id FROM contacts WHERE email='sundar@google.com'),
    'Influencer',
    'Google Cloud targeting Netflix workloads',
    ARRAY['cloud','compute']
  ),
  (gen_random_uuid(),
    (SELECT id FROM companies WHERE name='Netflix'),
    (SELECT id FROM companies WHERE name='Meta'),
    (SELECT id FROM contacts WHERE email='reed@netflix.com'),
    'Prospect',
    'Content distribution research partnership',
    ARRAY['media','content']
  ),
  (gen_random_uuid(),
    (SELECT id FROM companies WHERE name='JP Morgan'),
    (SELECT id FROM companies WHERE name='Apple'),
    (SELECT id FROM contacts WHERE email='jamie@jpmorgan.com'),
    'Channel Partner',
    'Credit card collaboration',
    ARRAY['finance','applecard']
  );

-- 6. Share Links
INSERT INTO share_links
(id, contact_id, company_id, link_token, permissions, notes)
VALUES
  (gen_random_uuid(), (SELECT id FROM contacts WHERE email='zuck@meta.com'), (SELECT id FROM companies WHERE name='Meta'), 'token1', '{"read": true}', 'Shared for Meta demo'),
  (gen_random_uuid(), (SELECT id FROM contacts WHERE email='tim@apple.com'), (SELECT id FROM companies WHERE name='Apple'), 'token2', '{"read": true}', 'Apple review'),
  (gen_random_uuid(), (SELECT id FROM contacts WHERE email='sundar@google.com'), (SELECT id FROM companies WHERE name='Google'), 'token3', '{"read": true, "write": true}', 'Google internal'),
  (gen_random_uuid(), (SELECT id FROM contacts WHERE email='reed@netflix.com'), (SELECT id FROM companies WHERE name='Netflix'), 'token4', '{"read": true}', 'Netflix audit'),
  (gen_random_uuid(), (SELECT id FROM contacts WHERE email='jamie@jpmorgan.com'), (SELECT id FROM companies WHERE name='JP Morgan'), 'token5', '{"read": true}', 'JPM vendor');
