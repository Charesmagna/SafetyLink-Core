import { redirectToLatestApk } from "./_latestApk.js";

export function onRequest() {
  return redirectToLatestApk();
}
