// worker/src/safety-feed.ts
// Unified Live Safety Feed & Crime Hotspot engine for Cloudflare Workers:
// - 3-tier fresh news waterfall (Local -> Province -> National Breaking) via FreeNewsAPI.io + Google News RSS (when:14d)
// - Real South African SAPS precinct / hijacking corridor hotspots + live crime spike elevation + Open-Meteo weather hazards
// - Strict freshness cutoff (<=14d preferred, <=30d max), sports/finance noise filter, and cached article URL resolver.

import { evaluateAreaHotspots } from '../../src/utils/crimeHotspots';

const SAFETY_KEYWORDS = /\b(crime|police|saps|jmpd|metro\s*police|arrest|robbery|hijack|shooting|murder|assault|theft|burglary|gang|protest|riot|strike|traffic|accident|crash|collision|road\s*clos|closure|fire|wildfire|blaze|flood|flooding|storm|thundershower|rain|rainfall|hail|heatwave|warning|weather|saws|outage|load\s*shed|blackout|water\s*cut|burst\s*pipe|emergency|ems|ambulance|rescue|evacuat|hazard|alert|safety|security)\b/i;

const NON_SAFETY_NOISE = /\b(cricket|icc|test\s*match|premier\s*league|champions\s*league|rugby|springboks|proteas|bafana|kaizer\s*chiefs|orlando\s*pirates|sundowns|tournament|box\s*office|album|concert|bourse|stock\s*exchange|share\s*price|dividend|earnings|tennis|golf|formula\s*1|grand\s*prix)\b/i;

type NewsScope = 'LOCAL' | 'PROVINCE' | 'NATIONAL';

interface WorkerNewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  provider: 'FREENEWSAPI' | 'GOOGLE_RSS';
  scope: NewsScope;
  scopeLabel: string;
  isBreaking: boolean;
  url: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  safetyRelevant: boolean;
  areaName: string;
  timestamp: number;
  feedType: 'LIVE_NEWS';
}

function classifySafetyCategory(text: string): string {
  const t = text.toLowerCase();
  if (/crime|police|saps|jmpd|robbery|hijack|shooting|murder|arrest|theft|burglary|assault|gang|protest/.test(t)) return 'CRIME';
  if (/traffic|accident|crash|collision|road\s*clos|highway|freeway|m1|n1|n2|n3|r21/.test(t)) return 'TRAFFIC';
  if (/fire|blaze|wildfire|flood|storm|thunder|hail|weather|saws|wind|heatwave|rain/.test(t)) return 'FIRE_HAZARD';
  if (/power|eskom|load\s*shed|blackout|water|outage|sewage|pipe|electricity/.test(t)) return 'POWER_WATER';
  if (/medical|ambulance|ems|hospital|paramedic|injur/.test(t)) return 'MEDICAL';
  if (/patrol|security|community\s*watch/.test(t)) return 'PATROL_UPDATE';
  return 'SUSPICIOUS';
}

function classifySafetySeverity(text: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const t = text.toLowerCase();
  if (/shooting|murder|fatal|killed|explosion|evacuat|wildfire|armed\s*robbery|hijack|critical|emergency\s*alert/.test(t)) return 'CRITICAL';
  if (/robbery|crash|collision|flood|storm|warning|fire|outage|protest|road\s*clos|arrest|police|saps/.test(t)) return 'HIGH';
  if (/traffic|delay|advisory|thundershower|wind|theft|water|rain/.test(t)) return 'MEDIUM';
  return 'LOW';
}

function decodeXmlEntities(str: string): string {
  return String(str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeFreeNewsTokens(raw: string): string {
  return String(raw || '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 4)
    .join(' ');
}

function normalizeTitleKey(title: string): string {
  return String(title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 64);
}

function weatherCodeLabel(code: number): { label: string; hazardous: boolean } {
  if (code >= 95) return { label: 'Thunderstorm Alert', hazardous: true };
  if (code >= 80) return { label: 'Heavy Rain Showers', hazardous: true };
  if (code >= 71) return { label: 'Snow / Freezing Conditions', hazardous: true };
  if (code >= 61) return { label: 'Rain Conditions', hazardous: code >= 65 };
  if (code >= 51) return { label: 'Light Drizzle', hazardous: false };
  if (code >= 45) return { label: 'Fog / Low Visibility', hazardous: true };
  if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', hazardous: false };
  return { label: 'Clear Conditions', hazardous: false };
}

const workerFnCache = new Map<string, { expiresAt: number; rows: any[] }>();
const workerArticleCache = new Map<string, { expiresAt: number; url: string; article: any }>();

async function fetchFreeNewsForTerm(apiKey: string, term: string): Promise<any[]> {
  const cleanTerm = sanitizeFreeNewsTokens(term);
  if (!cleanTerm || !apiKey) return [];
  const cKey = cleanTerm.toLowerCase();
  const cached = workerFnCache.get(cKey);
  if (cached && cached.expiresAt > Date.now()) return cached.rows;

  // FreeNewsAPI.io /v1/news works reliably when in_title is NOT combined with language=en
  const url = `https://api.freenewsapi.io/v1/news?in_title=${encodeURIComponent(cleanTerm)}&page_size=25`;
  try {
    const resp = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
      },
    });
    if (!resp.ok) return [];
    const json: any = await resp.json().catch(() => ({}));
    const rows = Array.isArray(json?.data) ? json.data : [];
    workerFnCache.set(cKey, { expiresAt: Date.now() + 5 * 60_000, rows });
    return rows;
  } catch {
    return [];
  }
}

async function fetchGoogleRssForTerm(
  term: string,
  scope: NewsScope,
  scopeLabel: string,
  countryCode: string,
  whenWindow: string,
): Promise<WorkerNewsItem[]> {
  const clean = String(term || '').trim();
  if (!clean) return [];
  const q = `"${clean}" (crime OR police OR saps OR hijacking OR safety OR traffic OR accident OR fire OR outage OR emergency OR weather) when:${whenWindow}`;
  const gl = /^[A-Z]{2}$/.test(countryCode) ? countryCode : 'ZA';
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en&gl=${gl}&ceid=${gl}:en`;
  const now = Date.now();
  try {
    const rssResp = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SafetyLinkFeed/1.0)' },
    });
    if (!rssResp.ok) return [];
    const xml = await rssResp.text();
    const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 15);
    return itemMatches
      .map((m, idx) => {
        const block = m[1];
        const rawTitle = block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
        const rawLink = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '';
        const rawDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || '';
        const rawSource = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] || '';
        const rawDesc = block.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '';
        const cleanTitle = decodeXmlEntities(rawTitle);
        const sourceName = decodeXmlEntities(rawSource) || 'Local News';
        const titleWithoutSource =
          sourceName && cleanTitle.endsWith(` - ${sourceName}`)
            ? cleanTitle.slice(0, -(` - ${sourceName}`).length).trim()
            : cleanTitle;
        const cleanDesc = decodeXmlEntities(rawDesc);
        const parsedTime = Date.parse(rawDate);
        const timestamp = Number.isFinite(parsedTime) ? parsedTime : 0;
        const url = decodeXmlEntities(rawLink);
        if (!titleWithoutSource || titleWithoutSource.length <= 5 || !/^https?:\/\//i.test(url) || !timestamp) {
          return null;
        }
        const combined = `${titleWithoutSource} ${cleanDesc}`;
        const safetyRelevant = SAFETY_KEYWORDS.test(combined);
        return {
          id: `rss-${scope.toLowerCase()}-${timestamp}-${idx}`,
          title: titleWithoutSource,
          description:
            cleanDesc && cleanDesc !== cleanTitle
              ? cleanDesc
              : `Live ${scope.toLowerCase()} safety update reported by ${sourceName} for ${scopeLabel}.`,
          source: sourceName,
          provider: 'GOOGLE_RSS' as const,
          scope,
          scopeLabel,
          isBreaking: timestamp >= now - 48 * 3600_000 && safetyRelevant,
          url,
          category: classifySafetyCategory(combined),
          severity: classifySafetySeverity(combined),
          safetyRelevant,
          areaName: scopeLabel,
          timestamp,
          feedType: 'LIVE_NEWS' as const,
        };
      })
      .filter((x): x is WorkerNewsItem => Boolean(x));
  } catch {
    return [];
  }
}

export async function resolveFreeNewsArticleUrl(
  apiKey: string,
  uuid: string,
): Promise<{ ok: boolean; url?: string; article?: any; error?: string }> {
  const cleanUuid = String(uuid || '').trim();
  if (!/^[a-f0-9-]{20,64}$/i.test(cleanUuid)) {
    return { ok: false, error: 'Invalid article identifier' };
  }
  const hit = workerArticleCache.get(cleanUuid);
  if (hit && hit.expiresAt > Date.now()) {
    return { ok: true, url: hit.url, article: hit.article };
  }
  if (!apiKey) {
    return { ok: false, error: 'FREENEWSAPI_KEY is not configured' };
  }
  try {
    const resp = await fetch(`https://api.freenewsapi.io/v1/details?uuid=${encodeURIComponent(cleanUuid)}`, {
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
      },
    });
    if (!resp.ok) {
      return { ok: false, error: `Article lookup returned HTTP ${resp.status}` };
    }
    const json: any = await resp.json().catch(() => ({}));
    const d = json?.data;
    const targetUrl = typeof d?.original_url === 'string' ? d.original_url.trim() : '';
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
      return { ok: false, error: 'Original article URL unavailable' };
    }
    workerArticleCache.set(cleanUuid, { expiresAt: Date.now() + 60 * 60_000, url: targetUrl, article: d });
    return { ok: true, url: targetUrl, article: d };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export async function handleWorkerLiveSafetyFeed(
  env: any,
  originUrl: string,
  params: { lat?: number; lng?: number; query?: string; radiusKm?: number; clientIp?: string },
) {
  const rawLat = typeof params.lat === 'number' ? params.lat : NaN;
  const rawLng = typeof params.lng === 'number' ? params.lng : NaN;
  const queryText = String(params.query || '').trim();
  const radiusKm = Math.min(100, Math.max(5, Number(params.radiusKm) || 25));
  const bdcKey = String(env?.BIGDATACLOUD_API_KEY || '').trim();

  let hasCoords = Number.isFinite(rawLat) && Number.isFinite(rawLng) && (rawLat !== 0 || rawLng !== 0);
  let resolvedLat = rawLat;
  let resolvedLng = rawLng;
  let suburb = '';
  let city = '';
  let state = '';
  let country = '';
  let countryCode = 'ZA';
  let geocoderProvider: 'BIGDATACLOUD' | 'BIGDATACLOUD_IP' | 'NOMINATIM' | 'FALLBACK' = 'FALLBACK';
  let displayLocation = queryText || (hasCoords ? `${rawLat.toFixed(4)}, ${rawLng.toFixed(4)}` : 'South Africa');

  // 0. If neither GPS coordinates nor a query was provided, attempt BigDataCloud IP Geolocation
  if (!hasCoords && !queryText) {
    if (bdcKey) {
      try {
        const ipParam = params.clientIp ? `ip=${encodeURIComponent(params.clientIp)}&` : '';
        const ipResp = await fetch(
          `https://api-bdc.net/data/ip-geolocation?${ipParam}localityLanguage=en&key=${encodeURIComponent(bdcKey)}`
        );
        if (ipResp.ok) {
          const ipData: any = await ipResp.json().catch(() => null);
          const loc = ipData?.location || {};
          if (Number.isFinite(Number(loc.latitude)) && Number.isFinite(Number(loc.longitude))) {
            resolvedLat = Number(loc.latitude);
            resolvedLng = Number(loc.longitude);
            hasCoords = true;
            suburb = loc.localityName || '';
            city = loc.city || loc.principalSubdivision || '';
            state = loc.principalSubdivision || '';
            country = ipData?.country?.name || '';
            countryCode = String(ipData?.country?.isoAlpha2 || 'ZA').toUpperCase();
            const labelParts = [suburb, city, state, country].filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx);
            if (labelParts.length > 0) displayLocation = labelParts.slice(0, 3).join(', ');
            geocoderProvider = 'BIGDATACLOUD_IP';
          }
        }
      } catch {
        // ignore IP geolocation failures
      }
    }
    if (!hasCoords && !queryText) {
      return { status: 400, json: { error: 'Provide GPS coordinates (lat, lng) or a city/suburb query.' } };
    }
  }

  // 1A. Primary Fast Reverse Geocode via BigDataCloud (when GPS coordinates + key are available)
  if (hasCoords && bdcKey && geocoderProvider !== 'BIGDATACLOUD_IP') {
    try {
      const bdcUrl = `https://api-bdc.net/data/reverse-geocode?latitude=${encodeURIComponent(String(resolvedLat))}&longitude=${encodeURIComponent(String(resolvedLng))}&localityLanguage=en&key=${encodeURIComponent(bdcKey)}`;
      const bdcResp = await fetch(bdcUrl);
      if (bdcResp.ok) {
        const bdc: any = await bdcResp.json().catch(() => null);
        if (bdc && (bdc.locality || bdc.city || bdc.principalSubdivision)) {
          suburb = bdc.locality && bdc.locality !== bdc.city ? bdc.locality : '';
          city = bdc.city || bdc.locality || '';
          state = bdc.principalSubdivision || '';
          country = bdc.countryName || '';
          countryCode = String(bdc.countryCode || 'ZA').toUpperCase();
          const labelParts = [suburb, city, state, country].filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx);
          if (labelParts.length > 0) displayLocation = labelParts.slice(0, 3).join(', ');
          geocoderProvider = 'BIGDATACLOUD';
        }
      }
    } catch {
      // fall through to Nominatim
    }
  }

  // 1B. Fallback / Text-Query Geocode via OpenStreetMap Nominatim
  if (geocoderProvider === 'FALLBACK') {
    try {
      const nomUrl = hasCoords
        ? `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(resolvedLat))}&lon=${encodeURIComponent(String(resolvedLng))}&zoom=14&addressdetails=1`
        : `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(queryText)}`;
      const geoResp = await fetch(nomUrl, {
        headers: {
          'User-Agent': 'SafetyLink-Core/1.0 (https://safetylink.online)',
          'Accept-Language': 'en',
        },
      });
      if (geoResp.ok) {
        const parsed: any = await geoResp.json().catch(() => null);
        const geoData = Array.isArray(parsed) ? parsed[0] || null : parsed;
        if (geoData) {
          if (!hasCoords && geoData.lat && geoData.lon) {
            resolvedLat = Number(geoData.lat);
            resolvedLng = Number(geoData.lon);
          }
          const addr = geoData.address || {};
          suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || addr.hamlet || '';
          city = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || '';
          state = addr.state || addr.region || '';
          country = addr.country || '';
          countryCode = String(addr.country_code || 'za').toUpperCase();
          const labelParts = [suburb, city, state, country].filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx);
          if (labelParts.length > 0) displayLocation = labelParts.slice(0, 3).join(', ');
          geocoderProvider = 'NOMINATIM';
        }
      }
    } catch {
      // fallback to provided query/coords
    }
  }

  const effectiveCoords = Number.isFinite(resolvedLat) && Number.isFinite(resolvedLng) && (resolvedLat !== 0 || resolvedLng !== 0);
  const areaLabel = [suburb, city].filter(Boolean).join(', ') || displayLocation;
  const now = Date.now();
  const cutoff14d = now - 14 * 86_400_000;
  const cutoff30d = now - 30 * 86_400_000;
  const freeNewsKey = String(env?.FREENEWSAPI_KEY || '').trim();
  const baseOrigin = originUrl.replace(/\/+$/, '');

  const mapFreeNewsRows = (rows: any[], scope: NewsScope, scopeLabel: string): WorkerNewsItem[] =>
    rows
      .map((item: any) => {
        const title = String(item?.title || '').trim();
        const uuid = String(item?.uuid || '').trim();
        const ts = Date.parse(String(item?.published_at || ''));
        const timestamp = Number.isFinite(ts) ? ts : now;
        const publisher = String(item?.publisher || 'Local News').trim();
        if (!title || !uuid) return null;
        const safetyRelevant = SAFETY_KEYWORDS.test(title);
        return {
          id: `freenews-${uuid}`,
          title,
          description: `Recent ${scope.toLowerCase()} report from ${publisher} covering ${scopeLabel}. Tap Read Source to view the full story.`,
          source: publisher,
          provider: 'FREENEWSAPI' as const,
          scope,
          scopeLabel,
          isBreaking: timestamp >= now - 48 * 3600_000 && safetyRelevant,
          url: `${baseOrigin}/api/safety-feed/article/${encodeURIComponent(uuid)}`,
          category: classifySafetyCategory(title),
          severity: classifySafetySeverity(title),
          safetyRelevant,
          areaName: scopeLabel,
          timestamp,
          feedType: 'LIVE_NEWS' as const,
        };
      })
      .filter((x): x is WorkerNewsItem => Boolean(x));

  const primaryLocalTerm = city || suburb || queryText || state;
  const provinceTerm = state && state.toLowerCase() !== primaryLocalTerm.toLowerCase() ? state : '';
  const nationalTerm = country || 'South Africa';

  // 2A. Tier 1 Local News (FreeNewsAPI + Google RSS)
  const [localFnRaw, localRss] = await Promise.all([
    freeNewsKey && primaryLocalTerm ? fetchFreeNewsForTerm(freeNewsKey, primaryLocalTerm) : Promise.resolve([]),
    primaryLocalTerm ? fetchGoogleRssForTerm(primaryLocalTerm, 'LOCAL', areaLabel, countryCode, '14d') : Promise.resolve([]),
  ]);
  const localFn = mapFreeNewsRows(localFnRaw, 'LOCAL', areaLabel);
  const localFreshCount = [...localFn, ...localRss].filter((i) => i.timestamp >= cutoff14d).length;

  // 2B. Tier 2 Province Fallback (if Local has < 5 fresh items)
  let provinceItems: WorkerNewsItem[] = [];
  if (localFreshCount < 5 && provinceTerm) {
    const provRssPromise = fetchGoogleRssForTerm(provinceTerm, 'PROVINCE', provinceTerm, countryCode, '14d');
    const provFnPromise = freeNewsKey
      ? (async () => {
          await new Promise((r) => setTimeout(r, 1050));
          return mapFreeNewsRows(await fetchFreeNewsForTerm(freeNewsKey, provinceTerm), 'PROVINCE', provinceTerm);
        })()
      : Promise.resolve([]);
    const [pFn, pRss] = await Promise.all([provFnPromise, provRssPromise]);
    provinceItems = [...pFn, ...pRss];
  }

  // 2C. Tier 3 National Breaking Safety Fallback (if Local + Province < 6 fresh items)
  const localAndProvCount = localFreshCount + provinceItems.filter((i) => i.timestamp >= cutoff14d).length;
  let nationalItems: WorkerNewsItem[] = [];
  if (localAndProvCount < 6 && nationalTerm) {
    const natRssPromise = fetchGoogleRssForTerm(nationalTerm, 'NATIONAL', `${nationalTerm} Breaking`, countryCode, '7d');
    const natFnPromise = freeNewsKey
      ? (async () => {
          await new Promise((r) => setTimeout(r, 1050));
          return mapFreeNewsRows(await fetchFreeNewsForTerm(freeNewsKey, nationalTerm), 'NATIONAL', `${nationalTerm} Breaking`);
        })()
      : Promise.resolve([]);
    const [nFn, nRss] = await Promise.all([natFnPromise, natRssPromise]);
    nationalItems = [...nFn, ...nRss];
  }

  // 3. Live weather from Open-Meteo
  const weather = await (async () => {
    if (!effectiveCoords) return null;
    try {
      const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${resolvedLat}&longitude=${resolvedLng}&current=temperature_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m&timezone=auto`;
      const wResp = await fetch(wUrl);
      if (!wResp.ok) return null;
      const wJson: any = await wResp.json();
      const cur = wJson?.current;
      if (!cur) return null;
      const code = Number(cur.weather_code ?? 0);
      const meta = weatherCodeLabel(code);
      const tempC = Number(cur.temperature_2m);
      const windKmh = Number(cur.wind_speed_10m);
      const gustsKmh = Number(cur.wind_gusts_10m);
      const precipMm = Number(cur.precipitation ?? 0);
      const hazardous =
        meta.hazardous ||
        (Number.isFinite(tempC) && (tempC >= 36 || tempC <= 2)) ||
        (Number.isFinite(gustsKmh) && gustsKmh >= 45) ||
        (Number.isFinite(precipMm) && precipMm >= 5);
      return {
        temperatureC: Number.isFinite(tempC) ? tempC : null,
        apparentTempC: Number.isFinite(Number(cur.apparent_temperature)) ? Number(cur.apparent_temperature) : null,
        windSpeedKmh: Number.isFinite(windKmh) ? windKmh : null,
        windGustsKmh: Number.isFinite(gustsKmh) ? gustsKmh : null,
        precipitationMm: Number.isFinite(precipMm) ? precipMm : 0,
        condition: meta.label,
        hazardous,
        advisoryText: hazardous ? meta.label : null,
        observedAt: cur.time || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  })();

  // 4. Merge, deduplicate, filter non-safety noise, enforce freshness (<=14d preferred, <=30d max)
  const allRaw = [...localFn, ...localRss, ...provinceItems, ...nationalItems];
  const seen = new Set<string>();
  const merged: WorkerNewsItem[] = [];
  for (const item of allRaw) {
    if (!item.safetyRelevant && NON_SAFETY_NOISE.test(item.title)) continue;
    const key = normalizeTitleKey(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  let fresh = merged.filter((i) => i.timestamp >= cutoff14d);
  if (fresh.length < 4) {
    fresh = merged.filter((i) => i.timestamp >= cutoff30d);
  }
  const safetyOnly = fresh.filter((i) => i.safetyRelevant);
  if (safetyOnly.length >= 5) {
    fresh = safetyOnly;
  }

  // Sort: LOCAL first, then PROVINCE, then NATIONAL; strictly newest-first within each scope
  const scopeRank: Record<NewsScope, number> = { LOCAL: 0, PROVINCE: 1, NATIONAL: 2 };
  fresh.sort((a, b) => {
    const sDiff = scopeRank[a.scope] - scopeRank[b.scope];
    if (sDiff !== 0) return sDiff;
    const dayDiff = Math.floor(b.timestamp / 86_400_000) - Math.floor(a.timestamp / 86_400_000);
    if (dayDiff !== 0) return dayDiff;
    if (a.safetyRelevant !== b.safetyRelevant) return a.safetyRelevant ? -1 : 1;
    return b.timestamp - a.timestamp;
  });

  const liveNews = fresh.slice(0, 24).map(({ safetyRelevant: _sr, ...rest }) => rest);

  // Breaking spotlight: freshest items from the last 72h sorted strictly newest-first
  const cutoff72h = now - 72 * 3600_000;
  const breakingHeadlines = [...liveNews]
    .filter((i) => i.timestamp >= cutoff72h)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 4);

  const scopeCounts = {
    local: liveNews.filter((i) => i.scope === 'LOCAL').length,
    province: liveNews.filter((i) => i.scope === 'PROVINCE').length,
    national: liveNews.filter((i) => i.scope === 'NATIONAL').length,
  };

  // 5. Evaluate live Crime Hotspots (SAPS precinct + live local crime news spike + weather hazard)
  const { advisories, hotspotStatus } = evaluateAreaHotspots({
    lat: effectiveCoords ? resolvedLat : null,
    lng: effectiveCoords ? resolvedLng : null,
    radiusKm,
    areaLabel,
    recentLocalNews: liveNews,
    communityReports: [],
    weather,
  });

  const freeNewsCount = liveNews.filter((i) => i.provider === 'FREENEWSAPI').length;
  const rssCount = liveNews.filter((i) => i.provider === 'GOOGLE_RSS').length;

  return {
    status: 200,
    json: {
      location: {
        lat: effectiveCoords ? resolvedLat : null,
        lng: effectiveCoords ? resolvedLng : null,
        suburb,
        city,
        state,
        country,
        countryCode,
        displayLocation,
      },
      radiusKm,
      weather,
      hotspotStatus,
      advisories,
      breakingHeadlines,
      liveNews,
      communityReports: [],
      newsProviders: {
        freeNewsApiActive: Boolean(freeNewsKey),
        freeNewsCount,
        rssCount,
        scopeCounts,
      },
      fetchedAt: Date.now(),
    },
  };
}
