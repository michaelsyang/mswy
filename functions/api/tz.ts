/**
 * Timezone preference bridge between the health dashboard (browser) and the
 * health coach (Hermes). The dashboard notes the resolved timezone here; the
 * coach reads it each run to phrase times in the viewer's local zone.
 *
 * - POST  -> store { tz, pref, detected, ts } in KV
 * - GET   -> return the stored value (and a detected fallback when empty)
 */
const KEY = "health.tz";

export interface Env {
  HEALTH_TZ: KVLike;
}

// Minimal KV surface (matches Cloudflare KVNamespace). Avoids depending on
// @cloudflare/workers-types in the app, which isn't part of the Vite build.
interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

// IANA zones we'll accept for the explicit override. "auto" = follow device.
const VALID_PREF = new Set(["auto", "America/Los_Angeles", "Asia/Seoul"]);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Keep to the dashboard's real device zone to avoid junk writes.
function sanitizeTz(tz: unknown): string | null {
  if (typeof tz !== "string" || tz.length === 0 || tz.length > 64) return null;
  // Accept any well-formed IANA-ish zone (e.g. "Asia/Seoul"), but reject
  // obviously non-zone garbage (spaces, quotes, control chars).
  if (!/^[A-Za-z]+(?:\/[A-Za-z_+-]+)+$/.test(tz)) return null;
  return tz;
}

export const onRequest = async (
  context: {
    request: Request;
    env: Env;
  }
): Promise<Response> => {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  // CORS preflight (dashboard is same-origin, but harmless to allow).
  if (method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (method === "GET") {
    const raw = await env.HEALTH_TZ.get(KEY);
    const t = raw ? raw.trim() : "";
    if (!t) {
      return json({ tz: null, source: "none" });
    }
    try {
      const v = JSON.parse(t);
      return json({ ...v, source: "kv" });
    } catch {
      return json({ tz: t, source: "kv" });
    }
  }

  if (method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ ok: false, error: "bad_json" }, 400);
    }
    const tz = sanitizeTz(body.detected ?? body.tz);
    const pref = VALID_PREF.has(body.pref as string)
      ? (body.pref as string)
      : "auto";
    if (!tz) {
      return json({ ok: false, error: "invalid_tz" }, 400);
    }
    const value = {
      tz,
      pref,
      detected: tz,
      ts: typeof body.ts === "number" ? body.ts : Date.now(),
    };
    await env.HEALTH_TZ.put(KEY, JSON.stringify(value));
    return json({ ok: true, stored: value });
  }

  return json({ ok: false, error: "method_not_allowed" }, 405);
};
