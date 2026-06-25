-- SAFETY-LINK v5.0 — Database Triggers
-- Apply after schema.sql

-- ── updated_at auto-updater ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_hardware_updated_at
    BEFORE UPDATE ON hardware_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── audit trigger function ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'alerts' THEN
    org_id := COALESCE(NEW.organization_id, OLD.organization_id);
    INSERT INTO audit_log (organization_id, action, entity_type, entity_id, detail)
    VALUES (org_id, TG_OP, 'alert', COALESCE(NEW.id, OLD.id),
      jsonb_build_object('status', NEW.status, 'tier', NEW.tier, 'is_drill', NEW.is_drill));
  ELSIF TG_TABLE_NAME = 'users' THEN
    org_id := COALESCE(NEW.organization_id, OLD.organization_id);
    INSERT INTO audit_log (organization_id, action, entity_type, entity_id, detail)
    VALUES (org_id, TG_OP, 'user', COALESCE(NEW.id, OLD.id),
      jsonb_build_object('email', NEW.email, 'role', NEW.role, 'status', NEW.status));
  ELSIF TG_TABLE_NAME = 'hardware_registry' THEN
    org_id := COALESCE(NEW.organization_id, OLD.organization_id);
    INSERT INTO audit_log (organization_id, action, entity_type, entity_id, detail)
    VALUES (org_id, TG_OP, 'hardware', COALESCE(NEW.id, OLD.id),
      jsonb_build_object('name', NEW.friendly_name, 'address', NEW.device_address));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_audit_alerts
    AFTER INSERT OR UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_audit_users
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_audit_hardware
    AFTER INSERT OR UPDATE OR DELETE ON hardware_registry
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Row Level Security ────────────────────────────────────────────────────
ALTER TABLE organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices                ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_registry      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE responders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tokens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_settings           ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.organization_id', TRUE), '')::UUID
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.user_role', TRUE), '')
$$ LANGUAGE sql STABLE;

DO $$ BEGIN
  CREATE POLICY org_isolation ON organizations USING (id = current_org_id() OR current_user_role() = 'platform_owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY user_isolation ON users USING (organization_id = current_org_id() OR current_user_role() = 'platform_owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY alert_isolation ON alerts USING (organization_id = current_org_id() OR current_user_role() = 'platform_owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
