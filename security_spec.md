# SafetyLink Core — Firestore Security Specification (Eight Pillars)

## 1. Data Invariants
1. **Identity & Anti-Self-Escalation**: Authenticated users can create `/users/{userId}` ONLY where `uid == request.auth.uid`, `role == 'Community Member'` on self-create, and `createdAt == request.time`. Users CANNOT modify their own `role`, `uid`, `createdAt`, or assign themselves `Organization Administrator` / `Super Admin`.
2. **PII Split Collection Isolation**: All PII (`email`, `phone`, `whatsapp`, `medicalInfo`, `homeAddress`, `workAddress`) lives strictly under `/users/{userId}/private/{docId}` readable/writable ONLY by `request.auth.uid == userId` or `isAdmin()`.
3. **Multi-Tenant Organization Isolation**: Users can only read/list `panicEvents` or `organizations` scoped to their own `userId` or verified `orgCode` membership fetched from `/users/{request.auth.uid}` (on `get`, never in `allow list`), or if `isAdmin()`.
4. **Immutable Audit Trail & Terminal State Locks**: `auditLogs` are append-only (`update, delete: false` for regular users). `panicEvents` in terminal state (`RESOLVED` or `CANCELLED`) cannot be reopened by non-admins.
5. **Path ID & Payload Boundary Hardening**: Every doc ID matches `^[a-zA-Z0-9_\-]+$` (`size() <= 128`), and every string field has explicit `.size()` bounds.

## 2. Dirty Dozen Attack Payloads
1. **Shadow Field Injection on User Create**: `{ "uid": "u1", "username": "eve", "role": "Community Member", "createdAt": "<request.time>", "isAdmin": true }` -> `PERMISSION_DENIED` (`hasOnly` rejects ghost key).
2. **Self-Assigned Privilege Escalation on User Create**: `{ "uid": "u1", "username": "eve", "role": "Organization Administrator", "createdAt": "<request.time>" }` -> `PERMISSION_DENIED`.
3. **Unauthorized Role Mutation via Update**: `{ "role": "Responder", "updatedAt": "<request.time>" }` on `/users/u1` by `u1` -> `PERMISSION_DENIED` (`affectedKeys().hasOnly(['fullName','lat','lng','activeSOS','battery','lastLocationUpdate','updatedAt'])`).
4. **Cross-Tenant PII Read**: `get(/users/victimUid/private/info)` authenticated as `attackerUid` -> `PERMISSION_DENIED`.
5. **Unverified Email Write**: Creating `/panicEvents/ev1` when `request.auth.token.email_verified == false` -> `PERMISSION_DENIED`.
6. **Impersonated Panic Trigger**: Creating `/panicEvents/ev2` with `userId: "victimUid"` while signed in as `attackerUid` -> `PERMISSION_DENIED`.
7. **Forged Timestamp Injection**: Creating `/panicEvents/ev3` with backdated `createdAt` (`!= request.time`) -> `PERMISSION_DENIED`.
8. **Terminal State Tampering**: Updating a `/panicEvents/ev4` whose `status == "RESOLVED"` back to `"TRIGGERED"` -> `PERMISSION_DENIED`.
9. **Path ID Poisoning / Oversized Document ID**: Writing `/panicEvents/${"a".repeat(200)}` or `/users/bad$id` -> `PERMISSION_DENIED`.
10. **Blanket Collection Scraping**: `list` query on `/panicEvents` without `where('userId', '==', uid)` -> `PERMISSION_DENIED`.
11. **Join Request Auto-Approval Attack**: Requester updating `/orgJoinRequests/req1` `status` from `"PENDING"` to `"APPROVED"` -> `PERMISSION_DENIED`.
12. **Audit Log Erasure / Mutation**: Attempting `update` or `delete` on `/auditLogs/log1` as non-admin -> `PERMISSION_DENIED`.
