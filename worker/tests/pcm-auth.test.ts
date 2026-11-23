import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hexHmac, verifyForwarderSignature, parseSignature, DEDUPE_WINDOW_MS } from '../src/pcm-auth.ts';

const SECRET = 'test-secret-not-real';
const BODY = '{"from":"+27821234567","text":"Please call me","sentStamp":1762300000000,"receivedStamp":1762300000500,"sim":"sim1"}';

test('valid signature over the exact raw body is accepted', async () => {
  const sig = await hexHmac(SECRET, BODY);
  assert.equal(await verifyForwarderSignature(BODY, sig, [SECRET]), true);
  assert.equal(await verifyForwarderSignature(BODY, 'sha256=' + sig, [SECRET]), true);
});

test('invalid signature is rejected', async () => {
  const sig = await hexHmac(SECRET, BODY);
  assert.equal(await verifyForwarderSignature(BODY, sig.replace(/.$/, sig.endsWith('0') ? '1' : '0'), [SECRET]), false);
  assert.equal(await verifyForwarderSignature(BODY, await hexHmac('wrong-secret', BODY), [SECRET]), false);
});

test('a changed body byte invalidates the signature', async () => {
  const sig = await hexHmac(SECRET, BODY);
  assert.equal(await verifyForwarderSignature(BODY.replace('+27821234567', '+27829999999'), sig, [SECRET]), false);
});

test('missing or malformed signature is rejected', async () => {
  assert.equal(await verifyForwarderSignature(BODY, undefined, [SECRET]), false);
  assert.equal(await verifyForwarderSignature(BODY, 'not-hex', [SECRET]), false);
});

test('secret with stray whitespace still verifies (trimmed once, server side)', async () => {
  const sig = await hexHmac(SECRET, BODY);
  assert.equal(await verifyForwarderSignature(BODY, sig, [SECRET + ' ']), true);
});

test('dedupe window is 90 seconds', () => {
  assert.equal(DEDUPE_WINDOW_MS, 90_000);
  assert.equal(parseSignature('sha256=AB'), 'ab');
});

function createMockD1() {
  const profiles = new Map<string, any>();
  const contacts: any[] = [];
  const events = new Map<string, any>();
  const retries = new Map<string, any>();
  const gateways = new Map<string, any>();
  const deviceTokens = new Map<string, { phone: string; token: string; platform: string; updated_at: number }>();

  return {
    profiles,
    contacts,
    events,
    retries,
    gateways,
    deviceTokens,
    async batch(stmts: any[]) {
      const out = [];
      for (const s of stmts) out.push(await s.run());
      return out;
    },
    prepare(sql: string) {
      let args: any[] = [];
      const stmt = {
        bind(...a: any[]) {
          args = a;
          return stmt;
        },
        async run() {
          if (sql.includes('INSERT INTO sl_profiles')) {
            profiles.set(args[0], { phone: args[0], name: args[1], lat: args[2], lng: args[3], token: args[4], updated_at: args[5] });
          } else if (sql.includes('UPDATE sl_profiles SET alert_note')) {
            const p = profiles.get(args[1]);
            if (p) p.alert_note = args[0];
          } else if (sql.includes('DELETE FROM sl_contacts')) {
            for (let i = contacts.length - 1; i >= 0; i--) {
              if (contacts[i].owner_phone === args[0]) contacts.splice(i, 1);
            }
          } else if (sql.includes('INSERT INTO sl_contacts')) {
            contacts.push({ id: args[0], owner_phone: args[1], name: args[2], contact_phone: args[3], sort_order: args[4] });
          } else if (sql.includes('INSERT INTO sl_pcm_events')) {
            events.set(args[0], { id: args[0], owner_phone: args[1], created_at: args[2], located: 0, dispatch_status: 'PROCESSING', attempts: 1 });
          } else if (sql.includes('UPDATE sl_pcm_events SET dispatch_status=')) {
            const idx = args.length === 2 ? args[1] : args[0];
            const ev = events.get(idx);
            if (ev) {
              if (sql.includes("dispatch_status='FAILED'")) {
                ev.dispatch_status = 'FAILED';
                ev.last_result = args[0];
              } else {
                ev.dispatch_status = args[0];
                ev.last_result = args[1];
              }
            }
          } else if (sql.includes('INSERT INTO sl_pcm_retries')) {
            retries.set(args[0], {
              id: args[0],
              event_id: args[1],
              owner_phone: args[2],
              recipient_phone: args[3],
              sms_body: args[4],
              attempts: 1,
              max_attempts: 5,
              status: 'PENDING',
              last_error: args[5],
              next_retry_at: args[6],
              created_at: args[7],
              updated_at: args[8],
            });
          } else if (sql.includes('UPDATE sl_pcm_retries SET status')) {
            if (sql.includes("status = 'PROVIDER_ACCEPTED'")) {
              const row = retries.get(args[2]);
              if (row) {
                row.status = 'PROVIDER_ACCEPTED';
                row.attempts = args[0];
                row.last_error = null;
                row.updated_at = args[1];
              }
            } else {
              const row = retries.get(args[5]);
              if (row) {
                row.status = args[0];
                row.attempts = args[1];
                row.last_error = args[2];
                row.next_retry_at = args[3];
                row.updated_at = args[4];
              }
            }
          } else if (sql.includes('INSERT INTO sl_gateway_health')) {
            gateways.set(args[0], {
              gateway_id: args[0],
              last_seen: args[1],
              battery: args[2],
              sim_slot: args[3],
              network: args[4],
              last_alert_at: null,
            });
          } else if (sql.includes('UPDATE sl_gateway_health SET last_alert_at')) {
            const g = gateways.get(args[1]);
            if (g) g.last_alert_at = args[0];
          } else if (sql.includes('INSERT INTO sl_device_tokens')) {
            deviceTokens.set(args[1], { phone: args[0], token: args[1], platform: 'android', updated_at: args[2] || Date.now() });
          } else if (sql.includes('DELETE FROM sl_device_tokens WHERE token =')) {
            deviceTokens.delete(args[0]);
          }
          return { success: true };
        },
        async first() {
          if (sql.includes('SELECT token FROM sl_profiles')) {
            const p = profiles.get(args[0]);
            return p ? { token: p.token } : null;
          }
          if (sql.includes('FROM sl_profiles WHERE phone')) {
            for (const a of args) {
              const p = profiles.get(a);
              if (p) return p;
            }
            return null;
          }
          if (sql.includes('FROM sl_pcm_events WHERE owner_phone=?')) {
            const matching = Array.from(events.values()).filter(
              e => e.owner_phone === args[0] && e.created_at > args[1] && e.dispatch_status !== 'FAILED'
            );
            return matching[0] || null;
          }
          if (sql.includes('COUNT(*) AS cnt FROM sl_pcm_retries')) {
            return { cnt: Array.from(retries.values()).filter(r => r.status === 'PENDING').length };
          }
          return null;
        },
        async all() {
          if (sql.includes('FROM sl_contacts')) {
            return { results: contacts.filter(c => args.includes(c.owner_phone)) };
          }
          if (sql.includes('FROM sl_device_tokens')) {
            return { results: Array.from(deviceTokens.values()).filter(t => args.includes(t.phone)) };
          }
          if (sql.includes('FROM sl_pcm_retries')) {
            const due = Array.from(retries.values()).filter(
              r => r.status === 'PENDING' && r.next_retry_at <= args[0] && r.attempts < r.max_attempts
            );
            return { results: due };
          }
          if (sql.includes('FROM sl_gateway_health')) {
            return { results: Array.from(gateways.values()) };
          }
          return { results: [] };
        },
      };
      return stmt;
    },
  };
}

test('offline PCM path sends strictly through SMSGate (never Twilio or VAPI) and queues failed SMS for retry', async () => {
  const { inboundPcm, processPendingPcmRetries, syncProfile } = await import('../src/zero-airtime.ts');
  const db = createMockD1();
  const env: any = {
    DB: db,
    SMSGATE_USERNAME: 'rain-user',
    SMSGATE_PASSWORD: 'rain-password',
    SMSGATE_BASE_URL: 'https://api.sms-gate.app',
    TWILIO_SID: 'AC_SHOULD_NOT_CALL',
    TWILIO_AUTH_TOKEN: 'TWILIO_SHOULD_NOT_CALL',
    TWILIO_NUMBER: '+16055695774',
    VAPI_PRIVATE_KEY: 'VAPI_SHOULD_NOT_CALL',
    VAPI_PHONE_NUMBER_ID: 'VAPI_ID',
    RESPONSE_CENTRE_NUMBER: '+27680079911',
  };

  await syncProfile(env, {
    phone: '0821234567',
    name: 'Test Victim',
    lat: -26.2041,
    lng: 28.0473,
    contacts: [
      { name: 'Owner Test', phone: '0680079911' },
      { name: 'Backup Contact', phone: '0831112222' },
    ],
  }, '');

  const calls: string[] = [];
  const origFetch = globalThis.fetch;
  let secondContactAttempts = 0;
  globalThis.fetch = (async (url: any, init: any) => {
    const u = String(url);
    calls.push(u);
    assert.ok(u.startsWith('https://api.sms-gate.app/3rdparty/v1/messages'), `Unexpected external call on offline path: ${u}`);
    const payload = JSON.parse(String(init.body));
    const target = payload.phoneNumbers[0];
    if (target === '+27831112222') {
      secondContactAttempts++;
      if (secondContactAttempts <= 2) {
        return new Response('gateway busy', { status: 503 });
      }
    }
    return new Response(JSON.stringify({ id: 'msg-123' }), { status: 202 });
  }) as any;

  try {
    const outcome = await inboundPcm(env, 'Please call me from 0821234567', '+27821234567');
    assert.equal(outcome.status, 200);
    assert.equal(outcome.json.status, 'PARTIAL');
    assert.equal(db.retries.size, 1);
    const queued = Array.from(db.retries.values())[0];
    assert.equal(queued.recipient_phone, '+27831112222');
    assert.equal(queued.status, 'PENDING');

    queued.next_retry_at = Date.now() - 1000;
    const retrySummary = await processPendingPcmRetries(env);
    assert.equal(retrySummary.processed, 1);
    assert.equal(retrySummary.sent, 1);
    assert.equal(queued.status, 'PROVIDER_ACCEPTED');
    assert.ok(calls.every(u => u.includes('api.sms-gate.app')));
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('Rain gateway heartbeat tracks online status and alerts watchdog when stale > 15m', async () => {
  const { recordGatewayHeartbeat, getGatewayHealth, checkGatewayStaleAlert } = await import('../src/zero-airtime.ts');
  const db = createMockD1();
  const env: any = { DB: db, RESPONSE_CENTRE_NUMBER: '+27680079911' };

  const hb = await recordGatewayHeartbeat(env, { gatewayId: 'rain-sim-1', battery: 92, simSlot: 'sim1', network: 'Rain 4G' });
  assert.equal(hb.status, 200);

  const healthy = await getGatewayHealth(env);
  assert.equal(healthy.json.anyOnline, true);

  // Backdate last_seen by 20 minutes to trigger stale watchdog
  db.gateways.get('rain-sim-1').last_seen = Date.now() - 20 * 60_000;
  const staleHealth = await getGatewayHealth(env);
  assert.equal(staleHealth.json.anyOnline, false);

  const alertRes = await checkGatewayStaleAlert(env);
  assert.equal(alertRes.stale, 1);
  assert.equal(alertRes.alerted, 1);

  // Cooldown suppresses duplicate watchdog alert immediately after
  const secondAlert = await checkGatewayStaleAlert(env);
  assert.equal(secondAlert.stale, 1);
  assert.equal(secondAlert.alerted, 0);
});

test('pure-TS MD5 and PayFast signature match RFC 1321 and node:crypto exactly', async () => {
  const { createHash } = await import('node:crypto');
  const { md5Hex, buildPayfastSignature } = await import('../src/payfast.ts');

  assert.equal(md5Hex(''), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(md5Hex('abc'), '900150983cd24fb0d6963f7d28e17f72');
  assert.equal(md5Hex('message digest'), 'f96b697d7cb7938d525a2f31aaf161d0');

  const fields = {
    merchant_id: '10000100',
    merchant_key: '46f0cd694581a',
    return_url: 'https://safetylink.online/#/payment-success',
    amount: '149.00',
    item_name: 'SafetyLink Standard',
  };
  const passphrase = 'test-passphrase-2026';
  const expectedRaw =
    'merchant_id=10000100&merchant_key=46f0cd694581a&return_url=https%3A%2F%2Fsafetylink.online%2F%23%2Fpayment-success&amount=149.00&item_name=SafetyLink+Standard&passphrase=test-passphrase-2026';
  const expectedHash = createHash('md5').update(expectedRaw).digest('hex');

  assert.equal(buildPayfastSignature(fields, passphrase), expectedHash);
});

test('Rain PCM extracts spaced/dashed SA numbers and pushes DATA-ONLY HIGH-priority FCM loud alarm to contacts', async () => {
  const { generateKeyPairSync } = await import('node:crypto');
  const { extractMsisdn, inboundPcm, syncProfile } = await import('../src/zero-airtime.ts');
  const { saveDeviceToken } = await import('../src/device-tokens.ts');

  assert.equal(extractMsisdn('Please call me: 072 123 4567'), '+27721234567');
  assert.equal(extractMsisdn('Pls call +27 82-123-4567'), '+27821234567');

  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  const db = createMockD1();
  const env: any = {
    DB: db,
    FCM_SERVICE_ACCOUNT: JSON.stringify({
      project_id: 'safetylink-99e56',
      client_email: 'firebase-adminsdk-test@safetylink-99e56.iam.gserviceaccount.com',
      private_key: privateKey,
    }),
  };

  await syncProfile(env, {
    phone: '082 123 4567',
    name: 'Lerato Mokoena',
    lat: -25.7479,
    lng: 28.2293,
    contacts: [{ name: 'Mom Contact', phone: '083 555 0199' }],
  }, '');

  // Register contact device token using local 0-prefix format to verify cross-format normalization
  await saveDeviceToken(db, '0835550199', 'fcm-contact-live-token-12345');

  const fcmRequests: any[] = [];
  const origFetch = globalThis.fetch;
  globalThis.fetch = (async (url: any, init: any) => {
    const u = String(url);
    if (u === 'https://oauth2.googleapis.com/token') {
      return new Response(JSON.stringify({ access_token: 'mock-oauth-token', expires_in: 3600 }), { status: 200 });
    }
    if (u.includes('fcm.googleapis.com/v1/projects/safetylink-99e56/messages:send')) {
      fcmRequests.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ name: 'projects/safetylink-99e56/messages/999' }), { status: 200 });
    }
    return new Response('not expected', { status: 500 });
  }) as any;

  try {
    const outcome = await inboundPcm(env, 'Please call me: 082 123 4567', '121');
    assert.equal(outcome.status, 200);
    assert.equal(outcome.json.providerAccepted, true);
    assert.equal(outcome.json.status, 'PARTIAL');
    assert.equal(outcome.json.msisdn, '+27821234567');
    assert.equal(fcmRequests.length, 1);

    const msg = fcmRequests[0].message;
    assert.equal(msg.token, 'fcm-contact-live-token-12345');
    // Critical: DATA-ONLY payload so Android OS always invokes SafetyFcmService.onMessageReceived() even when locked/killed
    assert.equal(msg.notification, undefined);
    assert.equal(msg.android.notification, undefined);
    assert.equal(msg.android.priority, 'HIGH');
    assert.equal(msg.android.direct_boot_ok, true);
    assert.equal(msg.data.type, 'EMERGENCY_RING');
    assert.equal(msg.data.callerName, 'Lerato Mokoena');
    assert.equal(msg.data.callerNumber, '+27821234567');
  } finally {
    globalThis.fetch = origFetch;
  }
});


