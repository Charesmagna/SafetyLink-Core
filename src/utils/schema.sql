-- CockroachDB High-Consistency Database Schema Design for SafetyLink
-- Optimized for high concurrency, global multi-region consistency, and instant querying under distress.

-- Enable UUID extension if needed (CockroachDB supports GenRandomUUID by default)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: user_tags
-- Stores physical BLE wearable devices, iTAG Keyfobs, and bonded smart bands associated with responder profiles.
CREATE TABLE IF NOT EXISTS user_tags (
    mac_address VARCHAR(17) PRIMARY KEY, -- Hardware MAC address (e.g. '00:1A:7D:F1:C9:8A') acting as unique device signature
    friendly_name VARCHAR(100) NOT NULL, -- User-defined name (e.g. 'Personal iTAG Ring')
    device_type VARCHAR(30) NOT NULL CHECK (device_type IN ('iTAG', 'RFD_Beacon', 'SmartBand')), -- Enum constraint for safety hardware verification
    is_primary BOOLEAN DEFAULT FALSE,    -- Designates primary panic trigger device
    battery_level INT NOT NULL CHECK (battery_level BETWEEN 0 AND 100),
    rssi INT NOT NULL CHECK (rssi BETWEEN -120 AND 0),
    connection_state VARCHAR(20) NOT NULL DEFAULT 'BONDED' CHECK (connection_state IN ('CONNECTED', 'DISCONNECTED', 'BONDED', 'CONNECTING')),
    bonded_at TIMESTAMPTZ DEFAULT now(), -- Timestamp with timezone to guarantee global chronological consistency
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    associated_user VARCHAR(100) NOT NULL, -- Ties device ownership to user profile username
    org_id VARCHAR(50), -- Bound organization code (null for independent users)

    -- Indexes to accelerate matching beacons on proximate scanning broadcasts
    INDEX idx_user_tags_user (associated_user),
    INDEX idx_user_tags_org (org_id)
);

-- Table: org_events
-- Records critical panic incidents, sequential escalation sequences, and real-time distress status logs.
CREATE TABLE IF NOT EXISTS org_events (
    id VARCHAR(50) PRIMARY KEY, -- High-priority unique incident identifier (e.g. 'INC-4819-SA')
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(), -- Time-zone aware dispatch clock
    latitude DECIMAL(9, 6) NOT NULL CHECK (latitude BETWEEN -90.0 AND 90.0), -- GPS coordinate bounding
    longitude DECIMAL(10, 6) NOT NULL CHECK (longitude BETWEEN -180.0 AND 180.0),
    description TEXT, -- Details of trigger sequence (e.g. 'Instant SOS broadcast active from iTAG Keyfob')
    severity VARCHAR(20) DEFAULT 'CRITICAL' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'DISPATCHED' CHECK (status IN ('TRIGGERED', 'ACTIVE', 'DISPATCHED', 'RESPONDER_ARRIVED', 'RESOLVED')),
    org_id VARCHAR(50) DEFAULT 'INDIVIDUAL', -- Ties event to enterprise dashboard
    triggered_by VARCHAR(100) NOT NULL, -- Username of triggering individual or hardware device signature

    -- High-consistency indexes for near-instant dashboard lookup
    INDEX idx_org_events_time_desc (timestamp DESC),
    INDEX idx_org_events_org_id (org_id),
    INDEX idx_org_events_status (status)
) WITH (primary_key_experimental_step = 'sharded_slots=8'); -- CockroachDB sharded index optimizing hot-spot mitigation on peak loads
