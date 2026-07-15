import { pgTable, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  orgCode: text('org_code'),
  role: text('role').notNull().default('Community Member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  passwordHash: text('password_hash').notNull(),
});

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  controlRoomNumber: text('control_room_number').notNull(),
  escalationPolicy: text('escalation_policy'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  approved: boolean('approved').notNull().default(true),
});

export const incidents = pgTable('incidents', {
  id: text('id').primaryKey(),
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  description: text('description').notNull(),
  orgId: text('org_id').notNull(),
  triggeredBy: text('triggered_by').notNull(),
  status: text('status').notNull().default('DISPATCHED'),
  severity: text('severity').notNull().default('CRITICAL'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  assignedResponder: text('assigned_responder'),
  timelineData: jsonb('timeline_data'),
});

export const telemetryLogs = pgTable('telemetry_logs', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  batteryLevel: integer('battery_level').notNull().default(100),
  rssi: integer('rssi').notNull().default(-50),
  status: text('status').notNull().default('OK'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

export const dispatchLogs = pgTable('dispatch_logs', {
  id: text('id').primaryKey(),
  channel: text('channel').notNull(),
  recipient: text('recipient').notNull(),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  status: text('status').notNull().default('QUEUED'),
  provider: text('provider').notNull(),
  errorCode: text('error_code'),
});
