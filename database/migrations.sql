-- SAFETY-LINK Database Migrations
-- Run: node backend/db/migrate.js
-- All statements are idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING).

CREATE TABLE IF NOT EXISTS organizations (
  id         SERIAL PRIMARY KEY,
  org_code   TEXT UNIQUE NOT NULL,
  name       TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  org_code      TEXT NOT NULL,
  name          TEXT NOT NULL,
  phone         TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  token         TEXT,
  role          TEXT NOT NULL DEFAULT 'operator',
  active        BOOLEAN DEFAULT TRUE,
  last_login    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_users_org FOREIGN KEY (org_code) REFERENCES organizations(org_code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS devices (
  id          SERIAL PRIMARY KEY,
  org_code    TEXT NOT NULL,
  device_id   TEXT UNIQUE NOT NULL,
  name        TEXT,
  platform    TEXT,
  os_version  TEXT,
  app_version TEXT,
  push_token  TEXT,
  last_seen   TIMESTAMP DEFAULT NOW(),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hardware_registry (
  id                  SERIAL PRIMARY KEY,
  org_code            TEXT NOT NULL,
  device_address      TEXT NOT NULL,
  friendly_name       TEXT NOT NULL,
  service_uuid        TEXT NOT NULL DEFAULT 'FFE0',
  characteristic_uuid TEXT NOT NULL DEFAULT 'FFE1',
  trigger_value       TEXT NOT NULL DEFAULT '01',
  rssi_baseline       INTEGER,
  calibration_payload JSONB,
  assigned_to_phone   TEXT,
  active              BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE (org_code, device_address)
);

CREATE TABLE IF NOT EXISTS alerts (
  id              SERIAL PRIMARY KEY,
  org_code        TEXT NOT NULL,
  operator_phone  TEXT,
  operator_name   TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  is_drill        BOOLEAN DEFAULT FALSE,
  status          TEXT NOT NULL DEFAULT 'active',
  tier            INTEGER NOT NULL DEFAULT 1,
  source          TEXT DEFAULT 'UI',
  accepted_by     TEXT,
  resolved_at     TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_events (
  id         SERIAL PRIMARY KEY,
  alert_id   INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload    JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS responders (
  id               SERIAL PRIMARY KEY,
  alert_id         INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  responder_phone  TEXT NOT NULL,
  responder_name   TEXT,
  accepted_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_profiles (
  id               SERIAL PRIMARY KEY,
  phone            TEXT UNIQUE NOT NULL,
  blood_type       TEXT,
  conditions       TEXT,
  medications      TEXT,
  allergies        TEXT,
  emergency_notes  TEXT,
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id               SERIAL PRIMARY KEY,
  org_code         TEXT,
  operator_phone   TEXT,
  action           TEXT NOT NULL,
  detail           TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                    SERIAL PRIMARY KEY,
  org_code              TEXT UNIQUE NOT NULL,
  plan                  TEXT NOT NULL DEFAULT 'free',
  max_users             INTEGER DEFAULT 10,
  max_alerts_per_month  INTEGER DEFAULT 100,
  sms_enabled           BOOLEAN DEFAULT FALSE,
  whatsapp_enabled      BOOLEAN DEFAULT FALSE,
  valid_until           TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id                  SERIAL PRIMARY KEY,
  org_code            TEXT,
  alert_id            INTEGER,
  to_number           TEXT NOT NULL,
  from_number         TEXT,
  message             TEXT NOT NULL,
  provider            TEXT NOT NULL,
  status              TEXT DEFAULT 'queued',
  provider_message_id TEXT,
  error_message       TEXT,
  sent_at             TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id                  SERIAL PRIMARY KEY,
  org_code            TEXT,
  alert_id            INTEGER,
  to_number           TEXT NOT NULL,
  message             TEXT NOT NULL,
  template_name       TEXT,
  status              TEXT DEFAULT 'queued',
  provider_message_id TEXT,
  error_message       TEXT,
  sent_at             TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_history (
  id              SERIAL PRIMARY KEY,
  org_code        TEXT NOT NULL,
  operator_phone  TEXT NOT NULL,
  alert_id        INTEGER,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  accuracy        DOUBLE PRECISION,
  altitude        DOUBLE PRECISION,
  heading         DOUBLE PRECISION,
  speed           DOUBLE PRECISION,
  recorded_at     TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_org_status     ON alerts(org_code, status);
CREATE INDEX IF NOT EXISTS idx_alerts_created        ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_events_alert    ON alert_events(alert_id);
CREATE INDEX IF NOT EXISTS idx_responders_alert      ON responders(alert_id);
CREATE INDEX IF NOT EXISTS idx_location_org_phone    ON location_history(org_code, operator_phone);
CREATE INDEX IF NOT EXISTS idx_location_recorded     ON location_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_org             ON users(org_code);
CREATE INDEX IF NOT EXISTS idx_audit_org             ON audit_log(org_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_org          ON sms_logs(org_code, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_hardware_org          ON hardware_registry(org_code);
