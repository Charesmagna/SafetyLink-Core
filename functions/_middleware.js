import { redirectToLatestApk } from "./_latestApk.js";

export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  if (path === "/SafetyLink.apk" || path === "/download/apk") {
    return redirectToLatestApk();
  }
  return context.next();
}
