import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_TIER_ORDER,
  createIncidentEnvelope,
  evaluatePinDisarm,
  advanceDispatchTier,
  getAdaptiveGpsPolicy,
  buildPcmCanonicalPayload,
  verifyPcmReplayWindow,
  matchVoiceTriggerPhrase,
} from './dispatchEngine.ts';

test('createIncidentEnvelope initializes canonical tier order and armed countdown', () => {
  const env = createIncidentEnvelope({
    source: 'BLE_ITAG',
    countdownSeconds: 10,
    nowMs: 1_700_000_000_000,
    incidentId: 'SL-INC-TEST01',
  });

  assert.equal(env.incidentId, 'SL-INC-TEST01');
  assert.equal(env.state, 'COUNTDOWN');
  assert.equal(env.countdownSeconds, 10);
  assert.deepEqual(
    env.tiers.map((t) => t.id),
    [...CANONICAL_TIER_ORDER]
  );
  assert.equal(env.executedTiers.length, 0);
});

test('advanceDispatchTier enforces strict idempotency per incidentId', () => {
  let env = createIncidentEnvelope({
    source: 'SOFTWARE_BUTTON',
    countdownSeconds: 0,
    networkOnline: true,
    hasAirtime: true,
    incidentId: 'SL-INC-IDEMP',
  });

  env = advanceDispatchTier(env, 'BACKEND_API', 120);
  assert.equal(env.tiers[0].status, 'SENT');
  assert.equal(env.tiers[0].attempts, 1);

  // Calling the same tier again must be a strict no-op
  const afterDuplicate = advanceDispatchTier(env, 'BACKEND_API', 999);
  assert.equal(afterDuplicate.tiers[0].attempts, 1);
  assert.equal(afterDuplicate.tiers[0].latencyMs, 120);
  assert.deepEqual(afterDuplicate.executedTiers, ['BACKEND_API']);
});

test('offline + R0 airtime automatically fails over to ZERO_AIRTIME_PCM', () => {
  let env = createIncidentEnvelope({
    source: 'BLE_ITAG',
    countdownSeconds: 0,
    networkOnline: false,
    hasAirtime: false,
    incidentId: 'SL-INC-R0',
  });

  for (const tier of CANONICAL_TIER_ORDER) {
    env = advanceDispatchTier(env, tier, 150);
  }

  assert.equal(env.state, 'PARTIAL_SUCCESS');
  assert.equal(env.tiers.find((t) => t.id === 'BACKEND_API')?.status, 'FAILED');
  assert.equal(env.tiers.find((t) => t.id === 'FCM_LOUD_ALARM')?.status, 'FAILED');
  assert.equal(env.tiers.find((t) => t.id === 'GSM_SMS')?.status, 'FAILED');
  assert.equal(env.tiers.find((t) => t.id === 'VOICE_CALL')?.status, 'FAILED');
  assert.equal(env.tiers.find((t) => t.id === 'ZERO_AIRTIME_PCM')?.status, 'SENT');
});

test('evaluatePinDisarm distinguishes normal Safety PIN, Silent Duress PIN, and wrong PIN', () => {
  const armed = createIncidentEnvelope({
    source: 'SOFTWARE_BUTTON',
    countdownSeconds: 10,
    incidentId: 'SL-INC-PIN',
  });

  const wrong = evaluatePinDisarm(armed, '0000', '1234', '9999');
  assert.equal(wrong.outcome, 'INVALID_PIN');
  assert.equal(wrong.envelope.state, 'COUNTDOWN');

  const safe = evaluatePinDisarm(armed, '1234', '1234', '9999');
  assert.equal(safe.outcome, 'DISARMED');
  assert.equal(safe.envelope.state, 'DISARMED');
  assert.equal(safe.envelope.duressTriggered, false);

  // Disarmed incident cannot advance dispatch tiers
  const attemptedAfterDisarm = advanceDispatchTier(safe.envelope, 'BACKEND_API', 100);
  assert.equal(attemptedAfterDisarm.executedTiers.length, 0);

  // Silent duress PIN enters COVERT_DURESS and still dispatches covertly
  const duress = evaluatePinDisarm(armed, '9999', '1234', '9999');
  assert.equal(duress.outcome, 'COVERT_DURESS');
  assert.equal(duress.envelope.state, 'COVERT_DURESS');
  assert.equal(duress.envelope.duressTriggered, true);

  const covertDispatched = advanceDispatchTier(duress.envelope, 'BACKEND_API', 95);
  assert.equal(covertDispatched.tiers[0].status, 'SENT');
  assert.equal(covertDispatched.state, 'COVERT_DURESS');
});

test('getAdaptiveGpsPolicy scales polling frequency by emergency state and battery level', () => {
  const sos = getAdaptiveGpsPolicy({ sosState: 'ACTIVE_SOS', batteryPercent: 10 });
  assert.equal(sos.mode, 'HIGH_ACCURACY_SOS');
  assert.equal(sos.intervalMs, 5_000);
  assert.equal(sos.enableHighAccuracy, true);

  const idleNormal = getAdaptiveGpsPolicy({ sosState: 'IDLE', batteryPercent: 85 });
  assert.equal(idleNormal.mode, 'PASSIVE_IDLE');
  assert.equal(idleNormal.intervalMs, 120_000);
  assert.equal(idleNormal.enableHighAccuracy, false);

  const idleLowBatt = getAdaptiveGpsPolicy({ sosState: 'IDLE', batteryPercent: 15, isCharging: false });
  assert.equal(idleLowBatt.mode, 'BATTERY_SAVER');
  assert.equal(idleLowBatt.intervalMs, 300_000);

  const idleChargingLowBatt = getAdaptiveGpsPolicy({ sosState: 'IDLE', batteryPercent: 15, isCharging: true });
  assert.equal(idleChargingLowBatt.mode, 'PASSIVE_IDLE');
});

test('verifyPcmReplayWindow rejects expired, future-skewed, and replayed Rain SIM webhooks', () => {
  const now = 1_700_000_500_000;
  const seen = new Set<string>();

  const payload = buildPcmCanonicalPayload({
    senderPhone: '+27 81 673 8186',
    timestampMs: now - 10_000,
    nonce: 'nonce-abc-1',
    body: 'Please call me +27821234567',
  });
  assert.equal(payload, `${now - 10_000}.nonce-abc-1.+27816738186.Please call me +27821234567`);

  const first = verifyPcmReplayWindow({ timestampMs: now - 10_000, nonce: 'nonce-abc-1', seenNonces: seen, nowMs: now });
  assert.equal(first.valid, true);
  assert.equal(first.reason, 'OK');

  // Replaying same nonce must fail
  const replay = verifyPcmReplayWindow({ timestampMs: now - 10_000, nonce: 'nonce-abc-1', seenNonces: seen, nowMs: now });
  assert.equal(replay.valid, false);
  assert.equal(replay.reason, 'REPLAY_DETECTED');

  // Expired (>5 min old) must fail
  const expired = verifyPcmReplayWindow({ timestampMs: now - 400_000, nonce: 'nonce-old', seenNonces: seen, nowMs: now });
  assert.equal(expired.valid, false);
  assert.equal(expired.reason, 'TOO_OLD');

  // Future skew (>60s ahead) must fail
  const future = verifyPcmReplayWindow({ timestampMs: now + 90_000, nonce: 'nonce-future', seenNonces: seen, nowMs: now });
  assert.equal(future.valid, false);
  assert.equal(future.reason, 'FUTURE_SKEW');
});

test('matchVoiceTriggerPhrase detects multilingual South African emergency phrases', () => {
  assert.deepEqual(matchVoiceTriggerPhrase('Please, SafetyLink help right now!'), {
    matched: true,
    language: 'en',
    phrase: 'safetylink help',
  });
  assert.deepEqual(matchVoiceTriggerPhrase('Hawu ngisize baba'), {
    matched: true,
    language: 'zu',
    phrase: 'ngisize',
  });
  assert.deepEqual(matchVoiceTriggerPhrase('Help my asseblief!'), {
    matched: true,
    language: 'af',
    phrase: 'help my asseblief',
  });
  assert.equal(matchVoiceTriggerPhrase('Good morning everyone, weather is sunny').matched, false);
});
