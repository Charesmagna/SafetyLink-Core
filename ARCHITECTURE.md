# SafetyStore Architectural Report

This architectural report outlines the design of "SafetyStore," a unified mobile platform that integrates headless e-commerce capabilities with enterprise physical security and IoT management. By leveraging a multi-tenant backend and modern APIs—such as the Shopify Storefront API for commerce and WebRTC for ultra-low latency video streaming—the system harmonizes transactional data with real-time hardware telemetry. To ensure a responsive user experience, the blueprint emphasizes local-network processing, event-driven middleware like Home Assistant for unified hardware communication, and native mobile integrations that keep the application performing reliably across various enterprise and consumer security environments.

## Technical Implementation Standards

### 1. Shopify Storefront API (Headless Commerce)
Use Storefront API Client for all product queries. Utilize GID format for resource identification.

**Query Pattern:**
```graphql
query getProduct($id: ID!) {
  product(id: $id) {
    id
    title
    handle
    description
  }
}
// Variable: {"id": "gid://shopify/Product/7857989384"}
```

### 2. Hikvision ISAPI (Local Control)
Use HTTP PUT/POST for local device command execution (bypass cloud latency).

**Payload Pattern:**
```json
// PUT /ISAPI/System/IO/softInputs/trigger?format=json
{
  "SoftIO": {
    "id": 1,
    "state": "active"
  }
}
```

### 3. Tuya IoT (Cloud Authentication)
Strict HMAC-SHA256 signing for all requests.

**Signature Logic:**
```python
# Signature = HMAC-SHA256(Client_ID + Access_Token + Timestamp + Method + Hash(Body) + URL)
import hmac, hashlib

def get_signature(client_id, secret, timestamp, method, url, body):
    sign_str = client_id + timestamp + method + "\n" + hashlib.sha256(body.encode()).hexdigest() + "\n\n" + url
    return hmac.new(secret.encode(), sign_str.encode(), hashlib.sha256).hexdigest().upper()
```

### 4. Media (WHEP/WebRTC)
Utilize MediaMTX/go2rtc. Interface via WHEP protocol for zero-delay video.

**Signaling Pattern:**
```http
POST /stream_name/whep HTTP/1.1
Content-Type: application/sdp

// SDP Offer Body
```
