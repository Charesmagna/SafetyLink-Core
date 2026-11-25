import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveUssdCode, formatLocalMsisdn } from '../services/pcmTrigger';
import { evaluateAreaHotspots } from './crimeHotspots';
import { haversineKm } from './safetyProximity';
import { buildPayfastSignature } from '../../worker/src/payfast';

test('formatLocalMsisdn normalizes E.164 South African numbers into 10-digit local format', () => {
  assert.equal(formatLocalMsisdn('+27 81 673 8186'), '0816738186');
  assert.equal(formatLocalMsisdn('27816738186'), '0816738186');
  assert.equal(formatLocalMsisdn('816738186'), '0816738186');
  assert.equal(formatLocalMsisdn('0816738186'), '0816738186');
});

test('resolveUssdCode generates exact South African carrier Please Call Me codes', () => {
  assert.equal(resolveUssdCode({ carrierPreset: 'MTN', gatewayNumber: '+27816738186' }), '*121*0816738186#');
  assert.equal(resolveUssdCode({ carrierPreset: 'VODACOM', gatewayNumber: '+27816738186' }), '*140*0816738186#');
  assert.equal(resolveUssdCode({ carrierPreset: 'CELL_C', gatewayNumber: '+27816738186' }), '*111*0816738186#');
  assert.equal(resolveUssdCode({ carrierPreset: 'TELKOM', gatewayNumber: '+27816738186' }), '*140*0816738186#');
  assert.equal(
    resolveUssdCode({ carrierPreset: 'AUTO', detectedCarrier: 'MTN-SA', gatewayNumber: '0816738186' }),
    '*121*0816738186#'
  );
  assert.equal(
    resolveUssdCode({ carrierPreset: 'CUSTOM', customPattern: '*130*{NUMBER}#', gatewayNumber: '0816738186' }),
    '*130*0816738186#'
  );
});

test('crime hotspot detector flags high-risk Johannesburg CBD coordinates with safety tips', () => {
  const result = evaluateAreaHotspots({
    lat: -26.2041,
    lng: 28.0473,
    areaLabel: 'Johannesburg CBD',
    radiusKm: 25,
    recentLocalNews: [],
    communityReports: [],
    weather: null,
  });
  assert.ok(result.hotspotStatus);
  assert.equal(result.hotspotStatus.insideHotspot, true);
  assert.ok(['CRITICAL', 'HIGH', 'MODERATE'].includes(result.hotspotStatus.level));
  assert.ok(Array.isArray(result.hotspotStatus.safetyTips) && result.hotspotStatus.safetyTips.length > 0);
});

test('haversineKm accurately computes great-circle distance', () => {
  // Johannesburg CBD to Pretoria CBD (~53 km)
  const km = haversineKm(-26.2041, 28.0473, -25.7479, 28.2293);
  assert.ok(km > 48 && km < 60, `Expected ~53km, got ${km}`);
});

test('PayFast signature generation is deterministic and ignores empty or signature fields', () => {
  const sig1 = buildPayfastSignature(
    { merchant_id: '10000100', merchant_key: '46f0cd694581a', amount: '49.00', item_name: 'SafetyLink Premium', signature: 'ignored' },
    'passphrase123'
  );
  const sig2 = buildPayfastSignature(
    { merchant_id: '10000100', merchant_key: '46f0cd694581a', amount: '49.00', item_name: 'SafetyLink Premium', custom_str1: '' },
    'passphrase123'
  );
  assert.equal(sig1, sig2);
  assert.equal(sig1.length, 32);
});
