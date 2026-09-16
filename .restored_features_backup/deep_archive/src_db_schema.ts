import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  orgCode: text('org_code'),
  role: text('role').notNull().default('Community Member'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  passwordHash: text('password_hash').notNull(),
  disabilityType: text('disability_type'),
  accessibilityPrefs: text('accessibility_prefs', { mode: 'json' }),
  needsVoiceControl: integer('needs_voice_control', { mode: 'boolean' }).default(false),
  needsLargeText: integer('needs_large_text', { mode: 'boolean' }).default(false),
  needsVibration: integer('needs_vibration', { mode: 'boolean' }).default(true),
  familyId: text('family_id'),
  ocUsername: text('oc_username'),
  ocPassword: text('oc_password_encrypted'),
  lang: text('lang').default('en')
});

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  controlRoomNumber: text('control_room_number').notNull(),
  escalationPolicy: text('escalation_policy'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  approved: integer('approved', { mode: 'boolean' }).notNull().default(true),
  orgCode: text('org_code').unique(),
  ntfyTopic: text('ntfy_topic').unique(),
  ocFolder: text('oc_folder'),
  adminUserId: text('admin_user_id'),
  ocUsername: text('oc_username').unique(),
  ocPassword: text('oc_password_encrypted')
});

export const families = sqliteTable('families', {
  id: text('id').primaryKey(),
  familyCode: text('family_code').notNull().unique(),
  name: text('name').notNull(),
  ntfyTopic: text('ntfy_topic').notNull().unique(),
  ocFolder: text('oc_folder').notNull(),
  adminUserId: text('admin_user_id').notNull().unique(),
  ocUsername: text('oc_username').notNull().unique(),
  ocPassword: text('oc_password_encrypted').notNull()
});

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  role: text('role').notNull(),
  lang: text('lang').notNull().default('en'),
  familyId: text('family_id'),
  orgId: text('org_id'),
  callOrder: integer('call_order').notNull().default(1)
});

export const incidents = sqliteTable('incidents', {
  id: text('id').primaryKey(),
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  description: text('description').notNull(),
  orgId: text('org_id').notNull(),
  triggeredBy: text('triggered_by').notNull(),
  status: text('status').notNull().default('DISPATCHED'),
  severity: text('severity').notNull().default('CRITICAL'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  assignedResponder: text('assigned_responder'),
  timelineData: text('timeline_data', { mode: 'json' }),
  familyId: text('family_id'),
  type: text('type'),
  address: text('address'),
  evidenceUrl: text('evidence_url', { mode: 'json' }),
  aiReportUrl: text('ai_report_url'),
  lizzyChecked: integer('lizzy_checked', { mode: 'boolean' }).default(false)
});

export const telemetryLogs = sqliteTable('telemetry_logs', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  batteryLevel: integer('battery_level').notNull().default(100),
  rssi: integer('rssi').notNull().default(-50),
  status: text('status').notNull().default('OK'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const dispatchLogs = sqliteTable('dispatch_logs', {
  id: text('id').primaryKey(),
  channel: text('channel').notNull(),
  recipient: text('recipient').notNull(),
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  status: text('status').notNull().default('QUEUED'),
  provider: text('provider').notNull(),
  errorCode: text('error_code'),
});
