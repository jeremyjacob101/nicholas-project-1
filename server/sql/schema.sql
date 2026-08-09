BEGIN;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY,
  sample_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  safe_filename TEXT NOT NULL,
  classification TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  object_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN (
      'uploaded',
      'queued',
      'processing',
      'completed',
      'failed'
    )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS uploads_company_created_idx
  ON uploads (company_id, created_at DESC);

INSERT INTO companies (id, name, slug)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'Hospital A',
    'hospital-a'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Hospital B',
    'hospital-b'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, company_id, name, email)
VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Alice',
    'alice@hospital-a.local'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'Bob',
    'bob@hospital-b.local'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
