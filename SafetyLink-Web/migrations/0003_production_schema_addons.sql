CREATE TABLE node_telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  battery_level INTEGER,
  signal_strength INTEGER,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE emergency_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE ble_beacons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  uuid TEXT NOT NULL,
  major INTEGER NOT NULL,
  minor INTEGER NOT NULL,
  label TEXT NOT NULL,
  assigned_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(uuid, major, minor)
);

CREATE INDEX idx_node_telemetry_user ON node_telemetry(user_id);
CREATE INDEX idx_panic_alerts_user ON panic_alerts(user_id);
CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_events_org ON events(org_id);
