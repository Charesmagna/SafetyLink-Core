-- SAFETY-LINK Row-Level Security Policies
-- Apply AFTER migrations.sql using a superuser connection.
-- These policies enforce per-tenant data isolation.

ALTER TABLE organizations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE responders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices         ENABLE ROW LEVEL SECURITY;

-- Create a helper function to extract org_code from JWT claim
CREATE OR REPLACE FUNCTION current_org_code() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.org_code', TRUE), '')
$$ LANGUAGE sql STABLE;

-- Organizations: each tenant sees only their own row
DROP POLICY IF EXISTS org_isolation ON organizations;
CREATE POLICY org_isolation ON organizations
  USING (org_code = current_org_code());

-- Users: tenant-scoped
DROP POLICY IF EXISTS user_isolation ON users;
CREATE POLICY user_isolation ON users
  USING (org_code = current_org_code());

-- Alerts: tenant-scoped
DROP POLICY IF EXISTS alert_isolation ON alerts;
CREATE POLICY alert_isolation ON alerts
  USING (org_code = current_org_code());

-- Alert events: scoped through alerts
DROP POLICY IF EXISTS alert_event_isolation ON alert_events;
CREATE POLICY alert_event_isolation ON alert_events
  USING (
    alert_id IN (SELECT id FROM alerts WHERE org_code = current_org_code())
  );

-- Responders: scoped through alerts
DROP POLICY IF EXISTS responder_isolation ON responders;
CREATE POLICY responder_isolation ON responders
  USING (
    alert_id IN (SELECT id FROM alerts WHERE org_code = current_org_code())
  );

-- Medical profiles: phone-based (operator sees only their own)
DROP POLICY IF EXISTS medical_isolation ON medical_profiles;
CREATE POLICY medical_isolation ON medical_profiles
  USING (phone = current_setting('app.operator_phone', TRUE));

-- Audit log: tenant-scoped
DROP POLICY IF EXISTS audit_isolation ON audit_log;
CREATE POLICY audit_isolation ON audit_log
  USING (org_code = current_org_code());

-- SMS logs: tenant-scoped
DROP POLICY IF EXISTS sms_isolation ON sms_logs;
CREATE POLICY sms_isolation ON sms_logs
  USING (org_code = current_org_code());

-- WhatsApp logs: tenant-scoped
DROP POLICY IF EXISTS wa_isolation ON whatsapp_logs;
CREATE POLICY wa_isolation ON whatsapp_logs
  USING (org_code = current_org_code());

-- Location history: tenant-scoped
DROP POLICY IF EXISTS location_isolation ON location_history;
CREATE POLICY location_isolation ON location_history
  USING (org_code = current_org_code());

-- Hardware registry: tenant-scoped
DROP POLICY IF EXISTS hardware_isolation ON hardware_registry;
CREATE POLICY hardware_isolation ON hardware_registry
  USING (org_code = current_org_code());

-- Devices: tenant-scoped
DROP POLICY IF EXISTS device_isolation ON devices;
CREATE POLICY device_isolation ON devices
  USING (org_code = current_org_code());
