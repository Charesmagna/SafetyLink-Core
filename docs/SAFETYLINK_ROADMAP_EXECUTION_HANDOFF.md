# SafetyLink Roadmap Execution Handoff (revised)

Target branch: `beta` (via PR #59). Production `main` must not be modified.
Each phase needs a passing gate before the next phase starts. Tick a box only when the evidence exists.

## Non-negotiable rules
- Do not modify production data, the production D1 database, or the production Worker during Beta isolation.
- Do not invent credentials. Do not print or commit secrets.
- Do not claim device or phone behaviour works without a documented real-device test.
- One phase at a time. No phase starts until the previous phase gate is ticked.

## Phase 0: Baseline and safety
- [ ] Record current SHAs of `main`, `beta` and the roadmap branch in this file.
- [ ] Verify a usable production database backup exists (export of D1 tables `users`, `organisations`, `sl_profiles`, `sl_contacts`, `sl_pcm_events`), with the backup file location and date recorded here. Backup verified by a read-back row count.
- [ ] Record the current production Worker version and the secret names configured (names only, never values).
- **Gate 0:** backup verified, baseline recorded, no production change made.

## Phase 2: Beta infrastructure isolation
- [ ] Create a separate Beta Worker and a separate Beta D1 database. Record their names and IDs (not secrets).
- [ ] Point Beta builds and the Beta test workflows at the Beta Worker only.
- [ ] Confirm the Beta deploy workflow cannot deploy to the production Worker.
- [ ] Confirm the production Worker URL is not used by any Beta test.
- **Gate 2:** Beta Worker answers its health route; production Worker unchanged (version recorded in Phase 0); automated checks pass.

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

## Website preview requirements (separate workstream)
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
