// Cloudflare Pages serves index.html for missing files that look like assets,
// so /SafetyLink.apk never hits _redirects. This function runs first.
const APK =
  "https://github.com/Charesmagna/SafetyLink-Core/releases/download/v1.1.965/SafetyLink-v1.1.965-Signed.apk";

export function onRequest() {
  return Response.redirect(APK, 302);
}
