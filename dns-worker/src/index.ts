// SafetyLink DNS Shield — Cloudflare Worker
// Runs at dns.safetylink.online/dns-query
// Blocks ads/trackers, forwards clean queries to 1.1.1.1

export interface Env {
  BLOCKLIST: KVNamespace;
  UPSTREAM_DOH: string;
  ADMIN_API_KEY?: string;
}

function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isDnsAdmin(request: Request, env: Env): { ok: boolean; status: number } {
  const expected = String(env.ADMIN_API_KEY || '').trim();
  if (!expected) return { ok: false, status: 503 };
  const auth = String(request.headers.get('Authorization') || '').trim();
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token || !safeEq(token, expected)) return { ok: false, status: 401 };
  return { ok: true, status: 200 };
}

// Default blocklist — extended by KV on each request
const DEFAULT_BLOCKED = new Set([
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'adnxs.com', 'adsystem.com', 'amazon-adsystem.com',
  'facebook.com', 'connect.facebook.net', 'graph.facebook.com',
  'analytics.google.com', 'hotjar.com', 'segment.io', 'mixpanel.com',
  'scorecardresearch.com', 'quantserve.com', 'outbrain.com', 'taboola.com',
  'tracking.safetylink-fake.com', // placeholder for malware domains
]);

async function isBlocked(env: Env, domain: string): Promise<boolean> {
  if (DEFAULT_BLOCKED.has(domain)) return true;
  // Check KV for custom blocks
  const blocked = await env.BLOCKLIST.get(domain);
  return blocked !== null;
}

// Parse DNS query hostname from wireformat
function parseQueryName(buffer: ArrayBuffer): string {
  const view = new DataView(buffer);
  let offset = 12; // Skip DNS header
  const parts: string[] = [];
  while (offset < buffer.byteLength) {
    const len = view.getUint8(offset);
    if (len === 0) break;
    offset++;
    const part = new TextDecoder().decode(new Uint8Array(buffer, offset, len));
    parts.push(part);
    offset += len;
  }
  return parts.join('.');
}

// Build NXDOMAIN / blocked response
function blockedResponse(queryBuffer: ArrayBuffer): Response {
  const query = new Uint8Array(queryBuffer);
  const response = new Uint8Array(query.length);
  response.set(query);
  // Set QR=1 (response), RCODE=3 (NXDOMAIN)
  response[2] = 0x81; // QR + standard query
  response[3] = 0x83; // RA + NXDOMAIN
  return new Response(response.buffer, {
    headers: { 'Content-Type': 'application/dns-message', 'Cache-Control': 'max-age=300' }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'SafetyLink DNS Shield' });
    }

    // Admin: add domain to blocklist (requires Bearer ADMIN_API_KEY)
    if (url.pathname === '/admin/block' && request.method === 'POST') {
      const auth = isDnsAdmin(request, env);
      if (!auth.ok) return Response.json({ error: auth.status === 503 ? 'Admin key not configured' : 'Unauthorized' }, { status: auth.status });
      const { domain } = await request.json<{ domain: string }>().catch(() => ({ domain: '' }));
      const cleanDomain = String(domain || '').trim().toLowerCase();
      if (!cleanDomain || !/^[a-z0-9.-]{3,253}$/.test(cleanDomain)) return Response.json({ error: 'valid domain required' }, { status: 400 });
      await env.BLOCKLIST.put(cleanDomain, '1');
      return Response.json({ blocked: cleanDomain });
    }

    // Admin: remove domain (requires Bearer ADMIN_API_KEY)
    if (url.pathname === '/admin/unblock' && request.method === 'POST') {
      const auth = isDnsAdmin(request, env);
      if (!auth.ok) return Response.json({ error: auth.status === 503 ? 'Admin key not configured' : 'Unauthorized' }, { status: auth.status });
      const { domain } = await request.json<{ domain: string }>().catch(() => ({ domain: '' }));
      const cleanDomain = String(domain || '').trim().toLowerCase();
      if (!cleanDomain) return Response.json({ error: 'domain required' }, { status: 400 });
      await env.BLOCKLIST.delete(cleanDomain);
      return Response.json({ unblocked: cleanDomain });
    }

    // DNS JSON API (GET /dns-query?name=example.com&type=A)
    if (url.pathname === '/dns-query' && request.method === 'GET') {
      const name = String(url.searchParams.get('name') || '').trim().toLowerCase();
      const type = String(url.searchParams.get('type') || 'A').trim().toUpperCase();
      if (!name) return Response.json({ error: 'name required' }, { status: 400 });
      if (await isBlocked(env, name)) {
        return Response.json({ Status: 3, Question: [{ name, type: 1 }], Answer: [] });
      }
      const upstream = await fetch(`${env.UPSTREAM_DOH}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
        headers: { Accept: 'application/dns-json' }
      });
      return new Response(upstream.body, { headers: { 'Content-Type': 'application/dns-json', 'Access-Control-Allow-Origin': '*' } });
    }

    // DNS wireformat POST (RFC 8484)
    if (url.pathname === '/dns-query' && request.method === 'POST') {
      const body = await request.arrayBuffer();
      try {
        const domain = parseQueryName(body);
        if (domain && await isBlocked(env, domain)) {
          return blockedResponse(body);
        }
      } catch {}
      // Forward to upstream
      const upstream = await fetch(env.UPSTREAM_DOH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/dns-message', Accept: 'application/dns-message' },
        body,
      });
      return new Response(upstream.body, {
        headers: { 'Content-Type': 'application/dns-message', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response('SafetyLink DNS Shield. Use /dns-query for DoH.', { status: 200 });
  }
};
