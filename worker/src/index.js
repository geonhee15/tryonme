// TRYONME — public FASHN AI proxy.
//
// Browser hits this Worker; the Worker adds the FASHN bearer token and
// forwards to api.fashn.ai. The browser never sees the key.
//
// Routes:
//   POST /v1/run             → FASHN /v1/run
//   GET  /v1/status/:id      → FASHN /v1/status/:id
//   GET  /v1/quota           → { used, limit, resetAt } for the caller's IP
//
// Cost protection: per-IP daily quota (default 5 runs/day) using KV.

const FASHN_BASE = 'https://api.fashn.ai/v1';
const DAILY_LIMIT_PER_IP = 5;

const ALLOWED_ORIGINS = new Set([
  'https://tryonme.kimkim.io',
  'https://kimkim.io',
  'http://localhost:5188',
  'http://localhost:4321',
]);

function corsHeadersFor(req) {
  const origin = req.headers.get('Origin') || '';
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://tryonme.kimkim.io';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(body, init = {}, req) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...corsHeadersFor(req), ...(init.headers || {}) },
  });
}

function todayKey(ip) {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  return `q:${ymd}:${ip}`;
}

function secondsUntilUtcMidnight() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return Math.max(60, Math.floor((next - now) / 1000));
}

async function getQuotaUsed(env, ip) {
  if (!env.RATE_LIMIT) return 0;
  const v = await env.RATE_LIMIT.get(todayKey(ip));
  return v ? parseInt(v, 10) || 0 : 0;
}

async function incQuota(env, ip) {
  if (!env.RATE_LIMIT) return 0;
  const key = todayKey(ip);
  const cur = await getQuotaUsed(env, ip);
  const next = cur + 1;
  await env.RATE_LIMIT.put(key, String(next), { expirationTtl: secondsUntilUtcMidnight() });
  return next;
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeadersFor(req) });
    }

    const url = new URL(req.url);
    const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'anon';

    if (!env.FASHN_API_KEY) {
      return json({ error: 'Server not configured: FASHN_API_KEY missing' }, { status: 500 }, req);
    }

    // Quota inspection (no charge, no FASHN call)
    if (url.pathname === '/v1/quota' && req.method === 'GET') {
      const used = await getQuotaUsed(env, ip);
      return json({ used, limit: DAILY_LIMIT_PER_IP, resetIn: secondsUntilUtcMidnight() }, {}, req);
    }

    // Start a try-on run
    if (url.pathname === '/v1/run' && req.method === 'POST') {
      const used = await getQuotaUsed(env, ip);
      if (used >= DAILY_LIMIT_PER_IP) {
        return json(
          { error: 'quota_exceeded', message: `오늘 무료 한도(${DAILY_LIMIT_PER_IP}회)를 다 쓰셨어요. 내일 다시 시도하거나 본인 FASHN 키를 설정해서 무제한으로 쓰세요.`, resetIn: secondsUntilUtcMidnight() },
          { status: 429 },
          req,
        );
      }
      const bodyText = await req.text();
      const fashnRes = await fetch(`${FASHN_BASE}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.FASHN_API_KEY}` },
        body: bodyText,
      });
      const text = await fashnRes.text();
      if (fashnRes.ok) {
        // Only count successful submissions against quota
        await incQuota(env, ip);
      }
      return new Response(text, {
        status: fashnRes.status,
        headers: { 'Content-Type': 'application/json', ...corsHeadersFor(req) },
      });
    }

    // Poll status
    if (url.pathname.startsWith('/v1/status/') && req.method === 'GET') {
      const id = url.pathname.slice('/v1/status/'.length);
      if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) {
        return json({ error: 'invalid_id' }, { status: 400 }, req);
      }
      const fashnRes = await fetch(`${FASHN_BASE}/status/${id}`, {
        headers: { 'Authorization': `Bearer ${env.FASHN_API_KEY}` },
      });
      const text = await fashnRes.text();
      return new Response(text, {
        status: fashnRes.status,
        headers: { 'Content-Type': 'application/json', ...corsHeadersFor(req) },
      });
    }

    return json({ error: 'not_found' }, { status: 404 }, req);
  },
};
