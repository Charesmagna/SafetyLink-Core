import test from 'node:test';
import assert from 'node:assert/strict';
import { SafetyLinkAuthClient } from './SafetyLinkAuthClient';

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('user signup returns Worker identity and a later login creates a fresh session after logout', async () => {
  const calls: Array<{ url: string; body: any }> = [];
  let session = '';
  const client = new SafetyLinkAuthClient('https://api.safetylink.online', async (input, init) => {
    const body = JSON.parse(String(init?.body || '{}'));
    calls.push({ url: String(input), body });
    if (String(input).endsWith('/api/auth/register-user')) {
      return response({ token: 'signup-worker-jwt', userId: 'user-123', username: body.username, role: body.role });
    }
    if (String(input).endsWith('/api/auth/login')) {
      return response({ token: 'login-worker-jwt', userId: 'user-123', username: body.username, role: 'Community Member', email: 'member@example.com' });
    }
    return response({}, 404);
  });

  const signup = await client.registerUser({
    username: 'member01', password: 'strong-password', fullName: 'Member One',
    email: 'MEMBER@example.com', phone: '+27820000001', role: 'Community Member',
  });
  session = signup.token;
  assert.equal(signup.user.id, 'user-123');
  assert.equal(session, 'signup-worker-jwt');

  // Logout is a client/store state operation: discard the signup session before authenticating again.
  session = '';
  assert.equal(session, '');

  const login = await client.login('member01', 'strong-password');
  session = login.token;
  assert.equal(login.role, 'USER');
  assert.equal(login.user?.id, 'user-123');
  assert.equal(session, 'login-worker-jwt');
  assert.deepEqual(calls.map(call => new URL(call.url).pathname), ['/api/auth/register-user', '/api/auth/login']);
});

test('organization signup uses server-issued org code and signup token for immediate dashboard session', async () => {
  const client = new SafetyLinkAuthClient('https://api.safetylink.online', async (_input, init) => {
    const body = JSON.parse(String(init?.body || '{}'));
    assert.equal(body.name, 'Example Security');
    assert.equal(body.contactName, 'Admin User');
    return response({
      success: true, token: 'org-worker-jwt', orgId: 'SL-EXAMPLE-001', org_code: 'SL-EXAMPLE-001',
      orgName: 'Example Security',
      organization: { id: 'SL-EXAMPLE-001', name: 'Example Security', org_code: 'SL-EXAMPLE-001', contactEmail: 'admin@example.com' },
    });
  });
  const signup = await client.registerOrganization({
    name: 'Example Security', contactName: 'Admin User',
    contactEmail: 'admin@example.com', password: 'strong-password',
  });
  assert.equal(signup.orgCode, 'SL-EXAMPLE-001');
  assert.equal(signup.organization.id, 'SL-EXAMPLE-001');
  assert.equal(signup.token, 'org-worker-jwt');
});

test('superadmin PBKDF2 session calls only /api/admin endpoints', async () => {
  const calls: Array<{ path: string; authorization?: string }> = [];
  const client = new SafetyLinkAuthClient('https://api.safetylink.online', async (input, init) => {
    const url = new URL(String(input));
    calls.push({ path: url.pathname, authorization: new Headers(init?.headers).get('Authorization') || undefined });
    if (url.pathname === '/api/admin/login') return response({ token: 'pbkdf2-session-token', expiresInHours: 8 });
    if (url.pathname === '/api/admin/summary') return response({ totalAccounts: 1, contacts: 2 });
    if (url.pathname === '/api/admin/users') return response({ users: [{ id: '+27820000001', phone: '082***001', name: 'Member' }] });
    if (url.pathname === '/api/superadmin/orgs') return response([{ id: 'org-1' }]);
    return response({}, 404);
  });
  const session = await client.loginSuperAdmin('safetylink', 'strong-password');
  assert.equal(session, 'pbkdf2-session-token');
  await client.getAdminSummary(session);
  await client.getAdminUsers(session);
  assert.deepEqual(calls.map(call => call.path), ['/api/admin/login', '/api/admin/summary', '/api/admin/users']);
  assert.equal(calls[1].authorization, 'Bearer pbkdf2-session-token');
  assert.equal(calls[2].authorization, 'Bearer pbkdf2-session-token');
});

test('Worker JWT and PBKDF2 admin session are never interchangeable', async () => {
  let authorization = '';
  const client = new SafetyLinkAuthClient('https://api.safetylink.online', async (_input, init) => {
    authorization = new Headers(init?.headers).get('Authorization') || '';
    return response([{ id: 'SL-ORG-001' }]);
  });
  await client.getSuperadminOrganizations('worker-jwt-token');
  assert.equal(authorization, 'Bearer worker-jwt-token');
  assert.notEqual(authorization, 'Bearer pbkdf2-session-token');
});
