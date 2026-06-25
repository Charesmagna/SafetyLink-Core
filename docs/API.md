# SAFETY-LINK API Reference

Base URL: `https://yourdomain/api`

All protected endpoints require: `Authorization: Bearer <token>`

---

## Authentication

### POST /api/auth/register
Register a new operator.

**Body:**
```json
{
  "name": "Jane Doe",
  "phone": "+27821234567",
  "org_code": "LSNW-A1",
  "password": "secure_password",
  "role": "operator"
}
```

**Roles:** `operator` | `responder` | `supervisor`

**Response 201:**
```json
{
  "message": "Registration successful",
  "user": { "id": 1, "name": "Jane Doe", "phone": "+27821234567", "org_code": "LSNW-A1", "role": "operator" }
}
```

---

### POST /api/auth/login
Authenticate and receive a JWT.

**Body:**
```json
{ "phone": "+27821234567", "password": "secure_password" }
```

**Response 200:**
```json
{
  "token": "eyJ...",
  "user": { "id": 1, "name": "Jane Doe", "org_code": "LSNW-A1", "role": "operator" }
}
```

---

### POST /api/auth/verify
Verify token validity. Returns user profile.

**Response 200:**
```json
{ "valid": true, "user": { "id": 1, "name": "Jane Doe", "role": "operator" } }
```

---

### GET /api/auth/users
List users in your organisation. Requires `supervisor` or `admin` role.

---

### PATCH /api/auth/users/:id/role
Change a user's role. Requires `supervisor` or `admin`.

**Body:** `{ "role": "responder" }`

---

## Alerts

### POST /api/alerts
Create a panic alert. Rate limited to 10/min.

**Body:**
```json
{
  "latitude": -26.3085,
  "longitude": 27.8344,
  "isDrill": false,
  "source": "UI"
}
```

**Response 201:** Full alert object.

Triggers:
- SMS to all responders/supervisors (if `SMS_ENABLED=true`)
- WhatsApp to dispatch number (if `WHATSAPP_ENABLED=true`)
- WebSocket broadcast to all connected admin clients

---

### GET /api/alerts
List alerts for your organisation.

**Query params:**
- `status` — `active` | `resolved`
- `limit` — max 500, default 100
- `offset` — pagination

---

### GET /api/alerts/:id
Single alert with events and responders.

---

### POST /api/alerts/:id/accept
Accept an alert as a responder.

---

### POST /api/alerts/:id/escalate
Escalate tier (1→2→3). Tier 2 triggers police SMS.

---

### POST /api/alerts/:id/resolve
Resolve an alert.

**Body (optional):** `{ "resolution": "Situation contained." }`

---

## Devices

### POST /api/devices
Register or heartbeat a mobile device.

**Body:**
```json
{
  "device_id": "unique-device-uuid",
  "platform": "android",
  "os_version": "14",
  "app_version": "4.0.0"
}
```

### GET /api/devices
List registered devices for your org.

---

## Location

### POST /api/location
Submit a GPS update (streamed during active alert).

**Body:**
```json
{
  "latitude": -26.3085,
  "longitude": 27.8344,
  "accuracy": 10.5,
  "alert_id": 42
}
```

### GET /api/location
Latest known position per operator (last 2 hours).

**Query:** `?alert_id=42` to scope to a specific alert.

---

## Hardware (BLE)

### POST /api/hardware/register
Register a BLE device.

**Body:**
```json
{
  "device_address": "AA:BB:CC:DD:EE:FF",
  "friendly_name": "Front Door Button",
  "service_uuid": "FFE0",
  "characteristic_uuid": "FFE1",
  "trigger_value": "01"
}
```

### POST /api/hardware/calibrate
Store RSSI baseline after calibration wizard.

**Body:**
```json
{
  "device_address": "AA:BB:CC:DD:EE:FF",
  "rssi_samples": [-65, -67, -63, -66, -64],
  "calibration_payload": { "capturedPayload": "01" }
}
```

### GET /api/hardware
List all registered hardware for your org.

---

## Medical Profiles

### GET /api/medical
Get your medical profile.

### POST /api/medical
Save your medical profile.

**Body:**
```json
{
  "blood_type": "O+",
  "conditions": "Hypertension",
  "medications": "Amlodipine 5mg",
  "allergies": "Penicillin",
  "emergency_notes": "Pacemaker fitted 2022"
}
```

### GET /api/medical/:phone
Retrieve another operator's medical profile (responder use).

---

## Analytics

### GET /api/analytics
Organisation statistics.

**Response:**
```json
{
  "stats": {
    "total": 47,
    "resolved": 39,
    "active": 2,
    "drills": 6,
    "avg_resolution_minutes": "12.4"
  },
  "alertsByDay": [...],
  "topResponders": [...],
  "auditLog": [...],
  "smsStats": { "total": 120, "sent": 115, "failed": 5 },
  "whatsappStats": { "total": 40, "sent": 38, "failed": 2 }
}
```

---

## WebSocket Events (Socket.IO)

Connect: `io({ path: '/socket.io' })`

Authenticate: `socket.handshake.auth = { token: '<jwt>' }`

Subscribe to org room: `socket.emit('subscribe', 'ORG_CODE')`

| Event | Direction | Payload |
|---|---|---|
| `new_alert` | Server→Client | Full alert object |
| `alert_updated` | Server→Client | Updated alert object |
| `alert_accepted` | Server→Client | `{ alertId, responder }` |
| `location_update` | Server→Client | `{ phone, lat, lon, ts }` |
| `location_ping` | Client→Server | `{ lat, lon, alertId }` |

---

## Error Responses

```json
{ "error": "Description of error" }
{ "error": "Validation failed", "details": [...] }
```

| Status | Meaning |
|---|---|
| 400 | Bad request |
| 401 | Authentication required |
| 403 | Insufficient role |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 422 | Validation failed |
| 429 | Rate limit exceeded |
| 500 | Server error |
