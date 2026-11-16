# Beta Environment Isolation Gate

Status: **BLOCKED — Beta is not an isolated environment.**

This document is a release-safety gate. It does not claim that Beta infrastructure has been provisioned.

## Verified repository configuration

On the `beta` branch at the time this gate was prepared:

- Root `wrangler.toml` sets `ENVIRONMENT = "production"`.
- `worker/wrangler.toml` also sets `ENVIRONMENT = "production"`.
- Both configurations bind D1 database `safetylink-core` with production database ID `9daa8cbf-861f-4483-92e5-9f03541c6e71`.
- Both configurations bind the production R2 bucket `safetylink-releases`.
- The Worker deployment workflow deploys the Worker named `safetylink-api`, exports the production D1 database, and writes its backup to the production R2 bucket.
- The deployment workflow has a manual dispatch trigger. A manual run selected from a non-main branch could therefore have deployed that branch's Worker code using production configuration.

## Safety change in this branch

The Worker deployment workflow now fails before checkout, install, backup, secret writes, or deployment unless `GITHUB_REF` is exactly `refs/heads/main`.

This is a production deployment guard only. It does **not** make Beta isolated and it does not create a Beta Worker, D1 database, R2 bucket, or provider credentials.

## Required infrastructure before any live Beta test

Create and verify these resources in the intended Cloudflare account. Record identifiers and resource names in the deployment environment—not in this repository:

1. Dedicated Worker: `safetylink-api-beta`.
2. Dedicated D1 database: `safetylink-core-beta`, with its own database ID.
3. Dedicated R2 bucket for Beta release artifacts and test archives, e.g. `safetylink-releases-beta`.
4. Dedicated Beta secrets: JWT signing secret, internal API secret, provider credentials, webhook secrets, and any other runtime secrets. Do not copy production credentials by default.
5. Beta-only environment variables: `ENVIRONMENT=beta`, explicit Beta API origin, and alert/dispatch settings that prevent accidental contact with real emergency recipients.
6. A Beta deployment workflow that uses only the Beta Worker name, Beta D1 binding, Beta R2 bucket, and Beta secrets. It must not export, write, or read production resources.
7. A disposable test tenant and test recipients. Provider routes must be stubbed or allow-listed until an explicitly approved controlled test is ready.

## Mandatory verification gate

Do not run live dispatch, create test incidents through the current Beta API, or deploy Beta until all checks pass:

- [ ] Confirm the Cloudflare account ID and ownership of the new resources.
- [ ] Confirm the Beta Worker is a distinct Worker with a distinct route/API hostname.
- [ ] Confirm the Beta D1 database ID differs from production.
- [ ] Confirm the Beta R2 bucket differs from production.
- [ ] Confirm Beta secrets are configured independently; never print secret values.
- [ ] Search the complete Beta configuration and workflows for production database IDs, production bucket names, production Worker names, production API URLs, and production webhook destinations.
- [ ] Deploy Beta and verify its health endpoint identifies the Beta environment.
- [ ] Insert a uniquely tagged test record into Beta D1, verify it exists there, and verify production D1 is unchanged.
- [ ] Upload and retrieve a harmless test object in Beta R2; verify production R2 is unchanged.
- [ ] Verify dispatch is disabled/stubbed by default and no real recipient can be contacted accidentally.
- [ ] Run backend integration tests against Beta only.

## Live-device/offline test boundary

An offline SMS test must originate from the actual Android handset and RAIN SIM. A cloud deployment cannot prove native SMS transmission. The RAIN path must not use USSD/Please Call Me unless the carrier confirms support. A controlled test SMS must be visibly labelled TEST and use the previously confirmed test recipient only after the isolated Beta gate passes.

## Promotion rule

Beta remains a test environment. Do not merge this work into `main`, deploy production, rotate production secrets, or change production bindings as part of this isolation task. Production promotion requires separate review and explicit approval.
