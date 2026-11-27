/**
 * Dirty Dozen Adversarial Security Test Suite for SafetyLink Firestore Rules
 *
 * Verifies all 12 hostile payloads defined in security_spec.md against the
 * structural invariants enforced in firestore.rules.
 */
export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  payload: Record<string, unknown>;
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on User Create',
    collection: '/users/u_attacker',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { uid: 'u_attacker', username: 'eve', role: 'Community Member', createdAt: 'SERVER_TIME', isAdmin: true },
  },
  {
    id: 2,
    name: 'Self-Assigned Privilege Escalation on User Create',
    collection: '/users/u_attacker',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { uid: 'u_attacker', username: 'eve', role: 'Organization Administrator', createdAt: 'SERVER_TIME' },
  },
  {
    id: 3,
    name: 'Unauthorized Role Mutation via User Update',
    collection: '/users/u_attacker',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { role: 'Responder', updatedAt: 'SERVER_TIME' },
  },
  {
    id: 4,
    name: 'Cross-Tenant PII Read',
    collection: '/users/u_victim/private/info',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    payload: { requesterUid: 'u_attacker' },
  },
  {
    id: 5,
    name: 'Unverified Email Write',
    collection: '/panicEvents/ev_unverified',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { emailVerified: false, incidentId: 'ev_unverified', userId: 'u_attacker' },
  },
  {
    id: 6,
    name: 'Impersonated Panic Trigger',
    collection: '/panicEvents/ev_spoof',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { incidentId: 'ev_spoof', userId: 'u_victim', orgId: 'INDIVIDUAL', status: 'TRIGGERED', latitude: -26.2, longitude: 28.0 },
  },
  {
    id: 7,
    name: 'Forged Timestamp Injection',
    collection: '/panicEvents/ev_backdate',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { incidentId: 'ev_backdate', userId: 'u_attacker', createdAt: '1999-01-01T00:00:00Z' },
  },
  {
    id: 8,
    name: 'Terminal State Tampering (RESOLVED -> TRIGGERED)',
    collection: '/panicEvents/ev_closed',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'TRIGGERED', updatedAt: 'SERVER_TIME' },
  },
  {
    id: 9,
    name: 'Path ID Poisoning / Oversized Document ID',
    collection: `/panicEvents/${'a'.repeat(160)}`,
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { incidentId: 'oversized' },
  },
  {
    id: 10,
    name: 'Blanket Collection Scraping without Owner Filter',
    collection: '/panicEvents',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    payload: { query: 'all_documents_no_where_clause' },
  },
  {
    id: 11,
    name: 'Join Request Self-Approval Attack',
    collection: '/orgJoinRequests/req_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'APPROVED', updatedAt: 'SERVER_TIME' },
  },
  {
    id: 12,
    name: 'Audit Log Erasure Attack',
    collection: '/auditLogs/log_1',
    operation: 'delete',
    expected: 'PERMISSION_DENIED',
    payload: {},
  },
];
