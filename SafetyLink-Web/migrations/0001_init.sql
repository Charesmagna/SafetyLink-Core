CREATE TABLE organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_code TEXT NOT NULL UNIQUE,
  org_name TEXT NOT NULL,
  admin_password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(org_id, phone)
);

CREATE TABLE panic_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  latitude REAL,
  longitude REAL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL,
  user_name TEXT,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
