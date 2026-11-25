import { Capacitor } from '@capacitor/core';

const DEFAULT_WORKER_API = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev';

function getConfiguredWorkerBase(): string {
  try {
    const raw = localStorage.getItem('sl_custom_backend_url');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string' && /^https?:\/\//i.test(parsed.trim())) {
        return parsed.trim().replace(/\/+$/, '');
      }
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_WORKER_API;
}

/**
 * Fetches a /api/gemini/* endpoint reliably across:
 * 1. AI Studio / Node server.ts web preview (relative URL)
 * 2. Cloudflare Pages static web (auto-falls back to Worker API if relative route 404s)
 * 3. Capacitor Android APK (targets configured Worker API directly instead of https://localhost)
 */
export async function fetchGeminiApi(path: string, init?: RequestInit): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const workerBase = getConfiguredWorkerBase();

  if (Capacitor.isNativePlatform()) {
    return fetch(`${workerBase}${normalizedPath}`, init);
  }

  try {
    const localRes = await fetch(normalizedPath, init);
    const contentType = localRes.headers.get('content-type') || '';
    const isHtmlFallback = contentType.includes('text/html');
    if (localRes.status !== 404 && !isHtmlFallback) {
      return localRes;
    }
  } catch {
    // Fall through to remote Worker API
  }

  return fetch(`${workerBase}${normalizedPath}`, init);
}
