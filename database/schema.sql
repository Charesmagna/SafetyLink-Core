-- SAFETY-LINK v5.0 — Complete PostgreSQL Schema
-- Uses uuid primary keys throughout.
-- Run after enabling: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── organizations ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name   TEXT NOT NULL,
  organization_code   TEXT UNIQUE NOT NULL,
  subscription_plan   TEXT NOT NULL DEFAULT 'free',
  status              TEXT NOT NULL DEFAULT 'active',
  owner_user_id       UUID,
  settings_encrypted  TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email             TEXT UNIQUE NOT NULL,
  password_hash     TEXT NOT NULL,
  refresh_token     TEXT,
  role              TEXT NOT NULL DEFAULT 'member',
  status            TEXT NOT NULL DEFAULT 'pending',
  fcm_token         TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_org    ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ── profiles ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_id  UUID REFERENCES organizations(id) ON DELETE CASCADE,
  display_name     TEXT NOT NULL,
  bio              TEXT,
  photo_url        TEXT,
  photo_base64     TEXT,
  primary_phone    TEXT,
  phone_2          TEXT,
  phone_3          TEXT,
  phone_4          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_org  ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

-- ── emergency_contacts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  relationship    TEXT,
  phone           TEXT NOT NULL,
  priority        INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id);

-- ── medical_profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  blood_type      TEXT,
  conditions      TEXT,
  medications     TEXT,
  allergies       TEXT,
  emergency_notes TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_org  ON medical_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_medical_user ON medical_profiles(user_id);

-- ── devices ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  device_id       TEXT UNIQUE NOT NULL,
  platform        TEXT,
  os_version      TEXT,
  app_version     TEXT,
  push_token      TEXT,
  last_seen       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_org ON devices(organization_id);

-- ── hardware_registry ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hardware_registry (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
  device_address      TEXT NOT NULL,
  friendly_name       TEXT NOT NULL,
  service_uuid        TEXT NOT NULL DEFAULT 'FFE0',
  characteristic_uuid TEXT NOT NULL DEFAULT 'FFE1',
  trigger_value       TEXT NOT NULL DEFAULT '01',
  rssi_baseline       INTEGER,
  calibration_payload JSONB,
  assigned_user_id    UUID REFERENCES users(id),
  active              BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, device_address)
);

CREATE INDEX IF NOT EXISTS idx_hardware_org ON hardware_registry(organization_id);

-- ── hardware_assignment_history ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hardware_assignment_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hardware_id     UUID REFERENCES hardware_registry(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_user_id   UUID REFERENCES users(id),
  assigned_by_user_id UUID REFERENCES users(id),
  assigned_at     TIMESTAMPTZ DEFAULT NOW(),
  unassigned_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hw_history_hardware ON hardware_assignment_history(hardware_id);

-- ── alerts ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         TEXT UNIQUE,
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id),
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  is_drill          BOOLEAN DEFAULT FALSE,
  status            TEXT NOT NULL DEFAULT 'active',
  tier              INTEGER NOT NULL DEFAULT 1,
  source            TEXT DEFAULT 'app',
  accepted_by_id    UUID REFERENCES users(id),
  resolved_by_id    UUID REFERENCES users(id),
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_org    ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_user   ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

-- ── alert_events ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id        UUID REFERENCES alerts(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  payload         JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_events_alert ON alert_events(alert_id);

-- ── responders ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS responders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id        UUID REFERENCES alerts(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'accepted',
  accepted_at     TIMESTAMPTZ DEFAULT NOW(),
  arrived_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_responders_alert ON responders(alert_id);
CREATE INDEX IF NOT EXISTS idx_responders_user  ON responders(user_id);

-- ── audit_log ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  detail          JSONB,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_org     ON audit_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity  ON audit_log(entity_type, entity_id);

-- ── subscriptions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id       UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan                  TEXT NOT NULL DEFAULT 'free',
  max_members           INTEGER DEFAULT 10,
  max_alerts_per_month  INTEGER DEFAULT 100,
  sms_enabled           BOOLEAN DEFAULT FALSE,
  whatsapp_enabled      BOOLEAN DEFAULT FALSE,
  voice_enabled         BOOLEAN DEFAULT FALSE,
  fcm_enabled           BOOLEAN DEFAULT TRUE,
  valid_until           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── sms_logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
  alert_id            UUID REFERENCES alerts(id) ON DELETE SET NULL,
  user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  to_number           TEXT NOT NULL,
  from_number         TEXT,
  message             TEXT NOT NULL,
  provider            TEXT NOT NULL,
  status              TEXT DEFAULT 'queued',
  provider_message_id TEXT,
  error_message       TEXT,
  sent_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_org   ON sms_logs(organization_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_alert ON sms_logs(alert_id);

-- ── whatsapp_logs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
  alert_id            UUID REFERENCES alerts(id) ON DELETE SET NULL,
  to_number           TEXT NOT NULL,
  message             TEXT NOT NULL,
  template_name       TEXT,
  status              TEXT DEFAULT 'queued',
  provider_message_id TEXT,
  error_message       TEXT,
  sent_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_org   ON whatsapp_logs(organization_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_alert ON whatsapp_logs(alert_id);

-- ── voice_logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voice_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  alert_id        UUID REFERENCES alerts(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  contact_number  TEXT NOT NULL,
  contact_name    TEXT,
  attempt_number  INTEGER DEFAULT 1,
  method          TEXT NOT NULL DEFAULT 'twilio',
  status          TEXT DEFAULT 'initiated',
  initiated_at    TIMESTAMPTZ DEFAULT NOW(),
  answered        BOOLEAN,
  error_message   TEXT
);

CREATE INDEX IF NOT EXISTS idx_voice_alert ON voice_logs(alert_id);

-- ── location_history ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS location_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_id        UUID REFERENCES alerts(id) ON DELETE SET NULL,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  accuracy        DOUBLE PRECISION,
  altitude        DOUBLE PRECISION,
  heading         DOUBLE PRECISION,
  speed           DOUBLE PRECISION,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_org  ON location_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_location_user ON location_history(user_id);
CREATE INDEX IF NOT EXISTS idx_location_rec  ON location_history(recorded_at DESC);

-- ── notification_tokens ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  token           TEXT NOT NULL,
  platform        TEXT DEFAULT 'android',
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_tokens_org  ON notification_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON notification_tokens(user_id);

-- ── org_settings ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_settings (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id            UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  sms_provider               TEXT DEFAULT 'twilio',
  sms_config_encrypted       TEXT,
  whatsapp_config_encrypted  TEXT,
  voice_config_encrypted     TEXT,
  escalation_delay_seconds   INTEGER DEFAULT 15,
  max_voice_contacts         INTEGER DEFAULT 3,
  map_center_lat             DOUBLE PRECISION DEFAULT -26.3085,
  map_center_lng             DOUBLE PRECISION DEFAULT 27.8344,
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);
