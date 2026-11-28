# ThingsBoard Cloud integration setup

SafetyLink sends telemetry through the SafetyLink Cloudflare Worker. The ThingsBoard integration key is never stored in the web app, PWA, Android APK, or repository.

## 1. Create an HTTP Integration in ThingsBoard Cloud

1. Sign in to `https://thingsboard.cloud`.
2. Open **Integrations** and create an **HTTP** integration.
3. Enable device creation for incoming messages if the integration wizard exposes the option.
4. Configure the uplink converter to decode the incoming JSON and create/update a device per SafetyLink installation.
5. Copy the HTTP Integration key. Do not paste it into GitHub source code or a chat.

Use this custom uplink converter:

```javascript
var data = decodeToJson(payload);

return {
    deviceName: data.deviceName,
    deviceType: data.deviceType || 'SafetyLink Installation',
    attributes: data.attributes || {},
    telemetry: {
        ts: data.ts || Date.now(),
        values: data.telemetry || {}
    }
};
```

The incoming device name is installation-specific (`SafetyLink-<installation-id>`). ThingsBoard should therefore create a separate device for each installation, provided device creation is enabled for the integration.

## 2. Store the integration key as a Worker secret

From the Cloudflare dashboard, open the `safetylink-api` Worker, then **Settings → Variables and Secrets**. Add this secret:

- Name: `THINGSBOARD_HTTP_INTEGRATION_KEY`
- Value: the HTTP Integration key copied from ThingsBoard

Do not use a ThingsBoard tenant-admin JWT, user session token, or device access token here. This route expects the HTTP Integration key.

Deploy the Worker after adding the secret. The frontend cannot configure or read this secret.

## 3. Verify

1. Sign in to SafetyLink using a real account.
2. Open the Super Admin / IoT integration section.
3. Run **SEND TEST EVENT**.
4. A successful result means the SafetyLink Worker received an upstream successful HTTP response from ThingsBoard.
5. In ThingsBoard, open **Entities → Devices** and find the device named `SafetyLink-<installation-id>`. Check its latest telemetry for `integrationTest` and `lastSeen`.

An HTTP Integration may return `204 No Content` by default; any successful 2xx response is treated as accepted. A UI success is not shown for missing credentials, rejected requests, or network errors.

## Telemetry fields

- `activeThreat`: boolean
- `drillMode`: boolean
- `batteryLevel`: integer percentage (0–100)
- `latitude`, `longitude`: valid coordinates when supplied
- `lastSeen`: server timestamp in milliseconds
- `accountStatus`, `orgId`, `safetyLinkUserId`: device attributes / telemetry context
- `integrationTest`: boolean test marker

Location is only forwarded when both valid coordinates are explicitly supplied by the client. The current Admin test sends only the integration-test marker and heartbeat metadata.

## Deployment boundary

This change is staged on `feature/thingsboard-cloud-integration`. It does not deploy the Worker automatically, modify the production `main` branch, or publish an APK to the production download bucket. The feature-branch APK workflow uploads a test artifact only.
