ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

UPDATE users
SET
  is_admin = true,
  features = (COALESCE(features, '{}'::jsonb) - 'google_calendar' - 'manage_availability') || '{"assign_work_to_jibran": true}'::jsonb
WHERE lower(email) = lower('wasi@gmail.com');

UPDATE users
SET
  is_admin = true,
  features = COALESCE(features, '{}'::jsonb) || '{"google_calendar": true, "manage_availability": true}'::jsonb
WHERE lower(email) = lower('k245620@nu.edu.pk');

CREATE TABLE IF NOT EXISTS google_calendar_connections (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  token_type TEXT,
  expiry_date BIGINT,
  calendar_id TEXT DEFAULT 'primary',
  connected_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assigned_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  assignee TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS availability_slots_owner_start_idx
ON availability_slots(owner_user_id, start_time);
