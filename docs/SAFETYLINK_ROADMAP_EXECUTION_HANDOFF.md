# SafetyLink Roadmap Execution Handoff (revised)

Target branch: `beta` (via PR #59). Production `main` must not be modified.
Each phase needs a passing gate before the next phase starts. Tick a box only when the evidence exists.

## Non-negotiable rules
- Do not modify production data, the production D1 database, or the production Worker during Beta isolation.
- Do not invent credentials. Do not print or commit secrets.
- Do not claim device or phone behaviour works without a documented real-device test.
- One phase at a time. No phase starts until the previous phase gate is ticked.

## Phase 0: Baseline and safety
Baseline record (fill in, do not leave blank):
- Branch SHAs: main `____`, beta `____`, roadmap branch `____`
- Production Worker version / deployment ID: `____`
- Production D1 database name and ID: `____` (ID is not a secret)
- Production R2 buckets used: `____`
- Secret NAMES configured (names only, never values): `____`
- Backup location (e.g. file path or export ID): `____`
- Backup timestamp (UTC): `____`
- Backup scope (tables): `users`, `organisations`, `sl_profiles`, `sl_contacts`, `sl_pcm_events`

Checkboxes:
- [ ] Baseline record above is complete.
- [ ] Backup exported from production (read-only export; production unchanged).
- [ ] Backup RESTORED into a separate temporary D1 database (name recorded). Restored row counts match the production counts recorded at backup time.
- [ ] Temporary restore database deleted or marked as test-only after verification.
**Gate 0:** a restore test passed with recorded counts. A backup that has not been restored is NOT a valid backup. No production change made.

## Phase 1: Repository and release hygiene
- [ ] Protected branch rules on `main` confirmed (no direct pushes to production).
- [ ] Production-deploy workflows confirmed to trigger only on approved refs.
- [ ] No secrets in tracked files (scan result recorded, names and locations only).
- [ ] Stale release metadata references removed (recorded by commit).
**Gate 1:** scan and rule checks recorded with evidence.

## Phase 2: Beta infrastructure isolation (starts only after Gate 1)
Isolation must be proven at configuration and deployment level, not by name alone.
- [ ] Beta Worker has its own name, route and deployment target.
- [ ] Beta Worker's D1 binding points to a Beta database ID, NOT the production ID (config file and live binding checked).
- [ ] Beta Worker's R2 bindings point to Beta buckets, NOT production buckets.
- [ ] Beta Worker's secrets are Beta-specific values (verified by a Beta-only test secret, never by printing values).
- [ ] Beta deploy workflow cannot target the production Worker (workflow reviewed and recorded).
- [ ] No Beta test uses the production Worker URL.
**Gate 2:** each isolation item above has recorded evidence. Automated checks pass. Production Worker version unchanged from the Phase 0 record.

## Phase 3: Authentication and authorization (starts only after Gate 2)
- [ ] Sign-up, login, logout and re-login work against the Beta Worker (automated test).
- [ ] Organisation creation returns a server-issued code and a session; owner can sign in (automated test).
- [ ] Super-admin login returns an admin session; admin summary and user list accept it (automated test).
- [ ] Phone test of each flow on a real device, result recorded here.
- **Gate 3:** all automated tests pass and the phone test results are recorded.

## Phase 4: Emergency dispatch and zero-airtime (starts only after Gate 3)
- [ ] HMAC check on the raw body, accepting only a correct signature (tests: valid, invalid, missing, prefixed).
- [ ] Duplicate suppression window is 90 seconds (test against the real database layer, not only a constant).
- [ ] Unknown caller: alert goes to the command centre only (test).
- [ ] Known victim: SMS to saved contacts; each provider result recorded as accepted or failed, never reported as handset-confirmed (test).
- [ ] Worker returns a non-2xx status on internal failure (test).
- **Gate 4:** tests pass in Beta; one controlled live test to the owner's number recorded.

## Phase 5: App, native Android, PWA and desktop (starts only after Gate 4)
- [ ] One countdown only, owned by the native service, user-set duration (phone test).
- [ ] Menu opens full screen on a real device (phone test).
- [ ] PWA and Windows builds pass in CI.
- **Gate 5:** builds pass and phone tests are recorded.

## Phase 6: Verification and promotion
- [ ] All automated checks green on `beta`.
- [ ] Written change list reviewed by the owner.
- [ ] Promotion to `main` happens only after owner approval.
- **Gate 6:** owner approval recorded.


## Workstreams A to H (added; all start only after Gate 2, each with its own gate)

Standing rules for every workstream:
- Telemetry is disclosed to users, minimal, encrypted, retention-defined under POPIA. No hidden tracking, no IMEI or serial collection.
- Offline-created accounts are marked PROVISIONAL and are never shown as verified server accounts until synchronised.
- Emergency status is tracked as QUEUED, SENT, PROVIDER_ACCEPTED, DELIVERED or CONFIRMED. Provider acceptance is never reported as delivery.
- Legacy demo and bypass login routes are removed, not replaced.

- [ ] **A. Platform intelligence:** server-side user, installation and device records (installation ID, model, OS, app version, first-seen, last-seen, status). Tests for every field.
- [ ] **B. Account governance:** super-admin activate, deactivate, suspend (with reason), revoke sessions, audit history (who, when, which account, why). Deactivated accounts rejected on protected APIs (test with an old session).
- [ ] **C. Registration repair:** online sign-up, login and organisation owner auto-login work against Beta (automated and phone tests). Diagnostics separate DNS, timeout, Worker unavailable, bad credentials, expired session, validation and server errors.
- [ ] **D. Offline identity:** provisional local profile, secure storage, queued sync, reconciliation on reconnect. Tests for queue, retry and conflict.
- [ ] **E. Release accountability:** every client reports app version and build; outdated versions detected; missing heartbeat flagged; architecture test fails if telemetry or version reporting is removed.
- [ ] **F. Backup and audit:** scheduled encrypted Cloudflare archive (R2) with restore test (Gate 0 method). Google Drive backup only after owner approves and POPIA review of what is copied.
- [ ] **G. Zero-data dispatch:** SMS path, Please Call Me path and offline native fallback, each independently tested. Network, SIM location and carrier confirmed by owner before any carrier-specific build (see Open Decisions).
- [ ] **H. Super-admin dashboard:** users by status and version, active counts (24h, 7d, 30d), failed logins, connectivity errors. Reads only from the authoritative server records.
**Gates A to H:** each workstream has recorded evidence (tests, phone results, restore results where relevant) before it is ticked.

## Open decisions (owner must answer; nothing is built on these until answered)
- [ ] Mobile network of the emergency SIM: RAIN / Vodacom / MTN / Telkom / Cell C / Other.
- [ ] Where the SIM sits: inside the SafetyLink phone / separate always-on phone / dedicated gateway device.
- [ ] Whether Google Drive backups are wanted, and what data may be copied to it.

## Website preview requirements (separate workstream, not part of Gates 0 to 6)
- [ ] Standalone realistic preview website stays at `/preview/`.
- [ ] "Preview" link removed from the header.
- [ ] Discreet P icon near the bottom of the landing content, blended into the design, not directly under the footer, not labelled "Preview".
- [ ] Continuous SafetyLink logo-video background preserved, except in slideshow, image and title areas.
- [ ] Navy/teal identity with restrained orange, realistic imagery, animated dashboard elements.
- [ ] Preview work kept distinct from the PWA/APK/Windows redesign.
- [ ] Desktop and mobile checked, with screenshots recorded here.
- **Gate P:** source change, build, and deployed `/preview/` check all confirmed. Nothing is claimed before this.

## Acceptance
The roadmap is complete only when every gate above is ticked with evidence. Unresolved dependencies must be listed here, not hidden.
