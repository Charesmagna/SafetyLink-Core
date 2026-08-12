-- SafetyLink Core :: CockroachDB Schema
-- Multi-region, strictly-serializable schema for BLE wearable telemetry
-- and organization-level emergency incident tracking.

-- Table: user_tags
-- Stores physical wearable MAC signatures, RSSI levels, and bonding status.
CREATE TABLE IF NOT EXISTS user_tags (
    mac_address VARCHAR(17) PRIMARY KEY, -- Hardware MAC address signature
    friendly_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(30) NOT NULL CHECK (device_type IN ('iTAG', 'RFD_Beacon', 'SmartBand')),
    is_primary BOOLEAN DEFAULT FALSE,
    battery_level INT NOT NULL CHECK (battery_level BETWEEN 0 AND 100),
    rssi INT NOT NULL CHECK (rssi BETWEEN -120 AND 0),
    connection_state VARCHAR(20) NOT NULL DEFAULT 'BONDED'
        CHECK (connection_state IN ('CONNECTED', 'DISCONNECTED', 'BONDED', 'CONNECTING')),
    bonded_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    associated_user VARCHAR(100) NOT NULL,
    org_id VARCHAR(50),

    INDEX idx_user_tags_user (associated_user),
    INDEX idx_user_tags_org (org_id)
);

-- Table: org_events
-- High-priority emergency incidents. Uses a sharded index on the primary
-- key to spread write hotspots when multiple panic signals fire concurrently
-- (e.g. a multi-person incident triggering several devices at once).
CREATE TABLE IF NOT EXISTS org_events (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'INC-4819-SA'
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
    latitude DECIMAL(9, 6) NOT NULL CHECK (latitude BETWEEN -90.0 AND 90.0),
    longitude DECIMAL(10, 6) NOT NULL CHECK (longitude BETWEEN -180.0 AND 180.0),
    description TEXT,
    severity VARCHAR(20) DEFAULT 'CRITICAL' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'DISPATCHED'
        CHECK (status IN ('TRIGGERED', 'ACTIVE', 'DISPATCHED', 'RESPONDER_ARRIVED', 'RESOLVED')),
    org_id VARCHAR(50) DEFAULT 'INDIVIDUAL',
    triggered_by VARCHAR(100) NOT NULL,

    INDEX idx_org_events_time_desc ("timestamp" DESC),
    INDEX idx_org_events_org_id (org_id),
    INDEX idx_org_events_status (status)
) WITH (primary_key_experimental_step = 'sharded_slots=8');

-- NOTE ON CREDENTIALS:
-- This schema assumes writes arrive via a server-side gateway, not directly
-- from the Android client. EmergencyService.java in this build currently
-- posts straight to the CockroachDB HTTP endpoint from the device — see the
-- TODO comment in that file. Before any production/public rollout, move
-- those calls behind a backend so DB credentials never ship inside the APK.
