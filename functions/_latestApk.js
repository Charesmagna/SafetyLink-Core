const LATEST =
  "https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases/latest";
const FALLBACK =
  "https://github.com/Charesmagna/SafetyLink-Core/releases/download/v1.1.965/SafetyLink-v1.1.965-Signed.apk";

export async function redirectToLatestApk() {
  let target = FALLBACK;
  try {
    const res = await fetch(LATEST, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "SafetyLink-Download",
      },
    });
    if (res.ok) {
      const data = await res.json();
      const assets = Array.isArray(data.assets) ? data.assets : [];
      const apks = assets.filter(
        (a) =>
          a &&
          typeof a.name === "string" &&
          a.name.toLowerCase().endsWith(".apk") &&
          typeof a.browser_download_url === "string"
      );
      const signed = apks.find((a) => a.name.toLowerCase().includes("signed"));
      const chosen = signed || apks[0];
      if (chosen) target = chosen.browser_download_url;
    }
  } catch (_) {
    // GitHub blip: keep the last known signed APK.
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      "Cache-Control": "public, max-age=120",
    },
  });
}
