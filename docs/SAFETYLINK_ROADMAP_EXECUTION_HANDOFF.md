# SafetyLink Roadmap Execution Handoff

**Target repository:** `Charesmagna/SafetyLink-Core`  
**Execution branch:** `safetylink/roadmap-execution`  
**Base:** `beta` at `dcdf07de465bc6a403e323743fd6941f4fc1fafd`  
**Production branch:** `main` — do not modify or merge into it as part of this work.

## Mission

Complete the SafetyLink implementation roadmap as one coordinated Beta programme. Preserve the current production release. Work in small, reviewable commits on this branch, run the repository's actual checks after each subsystem, and open a pull request against `beta`. Do not claim a feature is complete merely because code compiles.

## Verified audit findings (repository state inspected 2026-11-16)

1. `main` and `beta` have diverged. The recorded comparison was 5 commits ahead / 11 behind for Beta relative to main. Recheck live refs before rebasing or merging; do not force-push either branch.
2. The existing `copilot/auth-remediation-handoff` branch contains a server auth client and auth contract tests, but its recorded workflow failed at application TypeScript checking. Its history is not a clean fast-forward candidate for Beta. Port/reconcile the intended changes, do not merge it blindly.
3. The auth remediation workflow passed contract tests but failed the application typecheck. The log includes missing React/JSX type declarations and implicit-any errors in `src/pages/PrivacyPolicy.tsx` and `src/utils/continuousMediaEngine.ts`. Confirm current package manifests and lockfile before changing dependencies.
4. The audit found legacy local/demo/vault/Firebase paths in password-based auth flows. Remove fallback paths only after the server routes and response contracts are verified. A server failure must be reported as an error, never silently create or authenticate a local account.
5. The audit found Worker token issuance/verification that decodes a Base64 JSON payload without validating a cryptographic signature. Replace with a vetted signed-token implementation compatible with Cloudflare Workers (Web Crypto / maintained compatible library), strict algorithm and expiry validation, issuer/audience checks, and key rotation support. Never accept unsigned or algorithm-confused tokens.
6. The audit found client-supplied registration roles. Enforce role allowlists server-side; public signup may create only the least-privileged user role. Organization/admin/super-admin privileges must be granted only through explicit trusted server-side workflows.
7. The Beta application and Worker configuration were found to point at production Worker/D1/R2 resources. Introduce explicit isolated environments and fail closed if Beta configuration resolves to production resources.
8. The APK workflow was found to contain hardcoded signing credential material / repository-workspace keystore assumptions. Remove credential literals from tracked workflow/source, use GitHub Actions secrets and protected environment controls, and document key custody/rotation. Do not rotate an existing Play signing key without verifying the Play App Signing arrangement and update compatibility.
9. The audit found profile-sync ownership and PCM location endpoints insufficiently bound to verified phone/profile identity. Require proof of phone ownership and authenticated, scoped location updates; validate payloads, timestamps, replay windows, and rate limits.
10. The unknown-caller PCM notification path was found to acknowledge HTTP 200 without reliably checking downstream notification outcomes. Return success only when the gateway event has been durably recorded; use idempotent queue/outbox processing and retryable failure states.
11. Beta Android CI and main Android CI had successful runs in the inspected history. Windows packaging compiled but artifact upload failed due to artifact service/quota. Re-run current workflows; do not infer current status from historical runs.

## Required execution sequence

### Phase 0 — Baseline and safety
- Re-read current `main`, `beta`, and this branch heads; inspect open PRs and current workflow runs.
- Preserve the current successful production APK/release artefacts and record their checksums/commit association where available.
- Do not alter production Worker, D1, R2, DNS, domains, secrets, or release settings.
- Establish Beta-only deployment configuration and a clear guard that prevents Beta builds from using production resource IDs or dispatch destinations.

### Phase 1 — Repository and release hygiene
- Audit tracked files for credentials, private keys, keystores, tokens, and personal data. Never print secrets into logs or PRs.
- Remove hardcoded signing secrets from source/workflows. Use repository/environment secrets; add validation that fails with a safe actionable message when a required secret is absent.
- Review repository history for previously committed credentials. Rotate exposed credentials only through the account/provider owner and only after confirming dependencies.
- Add/verify branch rules or repository rulesets for `main` and `beta` if the connected GitHub permissions allow it. Require PR review and passing checks; do not weaken existing rules.

### Phase 2 — Beta infrastructure isolation
- Add separate Cloudflare Worker environment, D1 database, and R2 bucket for Beta.
- Ensure migrations are explicit and reproducible; never point Beta migrations at production.
- Use distinct Beta API base URL and build-time configuration for PWA, Android, and desktop.
- Add CI assertions that fail if a Beta build references production Worker hostnames, database IDs, or bucket names.
- Do not deploy infrastructure or change DNS without the required Cloudflare account credentials and explicit environment identifiers supplied by the repository owner.

### Phase 3 — Authentication and authorization
- Verify the actual Worker route paths, request schemas, response schemas, and status codes before wiring the client.
- Complete server-authoritative user signup, organization signup, and login.
- Use cryptographically signed, expiring tokens; enforce signature, issuer, audience, subject, expiry, and key ID checks.
- Enforce authorization on every protected route. Ignore/reject client-supplied privileged roles.
- Remove local/demo/Firebase/vault fallbacks from password-based login and registration. Keep any separately designed offline access feature isolated from password authentication and clearly labelled.
- Ensure logout, token refresh/revocation, session persistence, and error states are consistent.
- Add contract tests for success, malformed payload, duplicate account, invalid credentials, expired token, forged token, role escalation, server outage, and network timeout.

### Phase 4 — Emergency dispatch and zero-airtime
- Preserve raw-body HMAC verification for SMS-Gate/PCM callbacks. Use constant-time comparison, secret rotation, timestamp/replay validation, and bounded idempotency.
- Bind phone numbers to verified profiles. Reject unverified profile claims and spoofed location updates.
- Store inbound gateway events durably before acknowledging them.
- Use an outbox/queue for SMS, voice, push, Telegram, and WebSocket notifications. Track each provider independently with truthful states such as QUEUED, SENT/PROVIDER_ACCEPTED, FAILED, PARTIAL, and CONFIRMED only when a provider receipt supports that claim.
- Implement bounded retries, exponential backoff, dead-letter handling, duplicate suppression, and observability without leaking phone numbers or credentials.
- Do not send live emergency tests to real contacts during CI. Use sandbox/test recipients and a clearly separated manual real-device test plan.

### Phase 5 — App, native Android, PWA and desktop
- Preserve the current Android native service architecture and existing working build pipeline.
- Test SOS countdown/cancel/instant variants, foreground service, wake lock, boot recovery, BLE reconnect, iTAG press handling, locked-screen operation, and offline queue recovery on real devices.
- Ensure native and web dispatch paths report actual provider/OS outcomes; remove success-shaped stubs.
- Verify responsive website and PWA, global light/dark theme across all pages/components, accessibility, icons, manifest, service worker updates, and offline behaviour.
- Fix Windows artifact upload quota/configuration separately from compilation; use unique artifact names and supported retention/size settings.

### Phase 6 — Verification and handoff
- Run lockfile-respecting install, app typecheck, app build, Worker typecheck/tests, auth contract tests, security tests, Android APK build, PWA build, and desktop packaging.
- Review the complete diff for accidental generated files, credentials, unrelated redesigns, and changes to production URLs.
- Provide a PR summary with exact commits, checks, known limitations, manual test evidence, and a file-by-file change summary.
- Open a draft PR to `beta`; do not merge automatically.
- Only promote to `main` after owner review and explicit approval.

## Acceptance criteria

- No production branch, Worker, database, storage bucket, DNS, or release is changed by Beta implementation.
- No hardcoded signing credentials or authentication secrets remain in tracked code/workflows.
- Forged/unsigned/expired tokens are rejected; public signup cannot assign privileged roles.
- Password login and registration use the server as the sole authority.
- PCM/profile/location requests are authenticated, scoped, replay-resistant, and idempotent.
- Gateway callbacks are acknowledged only after durable event capture; downstream delivery status is truthful and retryable.
- Beta build configuration is demonstrably isolated from production.
- All CI checks pass, or each remaining failure is documented with logs and a concrete remediation.
- Real-device tests are explicitly separated from CI and recorded as not verified until actually performed.

## Constraints and owner-supplied dependencies

A code agent cannot safely invent or provision the user's Cloudflare resource IDs, SMS-Gate/Twilio/VAPI credentials, GitHub Actions secrets, Android signing keys, or real-device test evidence. Identify each missing value by its secret name/resource purpose only; never request or commit secret values in source files. Provide exact UI steps for the owner to configure secrets when needed.

**Important:** This document is an execution brief, not evidence that the listed implementation work has already been completed. Keep the branch and PR in draft until the code, CI, deployment isolation, and security acceptance criteria are verified.
