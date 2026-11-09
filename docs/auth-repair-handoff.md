# Authentication repair handoff

Branch: `copilot/auth-remediation-handoff` (based on `beta`).

This change adds `src/services/SafetyLinkAuthClient.ts` as a typed, server-authoritative client for the current Cloudflare Worker contract. It calls the Worker user/org registration routes, parses the token-based login response by `userId` versus `org_code`, and keeps PBKDF2 `/api/admin/*` sessions separate from `/api/superadmin/*` Worker-JWT calls. It does not silently create local accounts after an API failure and does not consult the app's persisted custom backend URL.

## Important integration status

This is a reusable client module, not yet wired into `src/utils/store.ts` or the auth screens. Existing store logic still contains legacy local/demo/Firebase fallbacks and old route calls. Integrate the module into those flows before treating the app login problem as fixed or building an APK. Do not copy credentials into app source or this branch.

The default API base is `https://api.safetylink.online`; verify that staging routes to the intended Worker before using it. The Worker has two distinct superadmin auth mechanisms: `/api/admin/login` returns the PBKDF2 admin session for `/api/admin/*`, while `/api/superadmin/orgs` expects the Worker JWT with `orgId === 'SL-ADMIN-0000'`. Do not send one token type to the other route family.

## Checks still required by the integrating agent

- Wire successful user registration/login into the store and ensure errors are surfaced without local/fake session fallback.
- Wire org registration response's returned `org_code` into session state/dashboard routing.
- Correct auth URL selection so stale `sl_custom_backend_url` does not silently override the intended API host; provide an explicit, reviewed override only if needed.
- Align the superadmin UI to the token type and endpoints it actually uses.
- Add client/store tests and run the app typecheck/build plus Worker tests.
- Verify signup → logout → login, org signup → org dashboard, and superadmin login/dashboard against isolated staging. No production deploy.

## Credentials warning

Repository instructions have contained credentials. Rotate exposed credentials and remove them through the repository's secret-incident cleanup process. This handoff contains no secrets.
