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

  return {
    profiles,
    contacts,
    events,
    retries,
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
          }
          return { success: true };
        },
        async first() {
          if (sql.includes('SELECT token FROM sl_profiles')) {
            const p = profiles.get(args[0]);
            return p ? { token: p.token } : null;
          }
          if (sql.includes('SELECT name, lat, lng, alert_note FROM sl_profiles')) {
            return profiles.get(args[0]) || null;
          }
          if (sql.includes('SELECT phone FROM sl_profiles')) {
            const p = profiles.get(args[0]);
            return p ? { phone: p.phone } : null;
          }
          if (sql.includes('FROM sl_pcm_events WHERE owner_phone=?')) {
            const matching = Array.from(events.values()).filter(
              e => e.owner_phone === args[0] && e.created_at > args[1] && e.dispatch_status !== 'FAILED'
            );
            return matching[0] || null;
          }
          return null;
        },
        async all() {
          if (sql.includes('FROM sl_contacts')) {
            return { results: contacts.filter(c => c.owner_phone === args[0]) };
          }
          if (sql.includes('FROM sl_pcm_retries')) {
            const due = Array.from(retries.values()).filter(
              r => r.status === 'PENDING' && r.next_retry_at <= args[0] && r.attempts < r.max_attempts
            );
            return { results: due };
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

    // Simulate 65 seconds passing so retry job picks it up cleanly
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
