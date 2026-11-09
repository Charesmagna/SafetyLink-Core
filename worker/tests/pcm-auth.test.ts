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
