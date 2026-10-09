/**
 * Shared HTTP Basic Auth gate for mswy.xyz Pages Functions.
 *
 * One reusable component; each protected page declares its own credentials so
 * different pages can have different passwords. Credentials come from Pages
 * project env vars (secrets), never from this repo — this file is public.
 *
 * Usage from a middleware:
 *   import { basicAuthGate, PROTECTED_PREFIXES } from "../lib/auth";
 *   export const onRequest = (ctx) => basicAuthGate(ctx, PROTECTED_PREFIXES);
 *
 * Env vars per protected prefix (set via wrangler pages secret put):
 *   HEALTH_USER / HEALTH_PASSWORD   -> /health, /data.json, /coach.json
 *   TEST_USER / TEST_PASSWORD       -> /test
 */

export interface ProtectedPrefix {
  /** URL path prefix to protect, e.g. "/health". */
  prefix: string;
  /** Env var names holding the expected credentials. */
  userVar: string;
  passwordVar: string;
  /** Human-readable realm shown in the browser login prompt. */
  realm: string;
}

export const PROTECTED_PREFIXES: ProtectedPrefix[] = [
  {
    prefix: "/health",
    userVar: "HEALTH_USER",
    passwordVar: "HEALTH_PASSWORD",
    realm: "mswy health",
  },
  {
    prefix: "/data.json",
    userVar: "HEALTH_USER",
    passwordVar: "HEALTH_PASSWORD",
    realm: "mswy health",
  },
  {
    prefix: "/coach.json",
    userVar: "HEALTH_USER",
    passwordVar: "HEALTH_PASSWORD",
    realm: "mswy health",
  },
  {
    prefix: "/test",
    userVar: "TEST_USER",
    passwordVar: "TEST_PASSWORD",
    realm: "mswy test",
  },
];

function unauthorized(realm: string): Response {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${realm}", charset="UTF-8"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Length-safe equality that reads all bytes regardless of mismatch position. */
function secureEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function checkCreds(
  header: string | null,
  page: ProtectedPrefix,
  env: Record<string, string | undefined>,
): boolean {
  if (!header || !header.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);
  const expUser = env[page.userVar];
  const expPass = env[page.passwordVar];
  if (!expUser || !expPass) return false; // unconfigured = fail closed
  return secureEqual(user, expUser) && secureEqual(pass, expPass);
}

/**
 * Pages Functions middleware: gate matching prefixes with per-page Basic Auth,
 * pass everything else through untouched.
 */
export async function basicAuthGate(
  context: {
    request: Request;
    functionPath: string;
    env: Record<string, string | undefined> & { ASSETS: unknown };
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  },
  protectedPrefixes: ProtectedPrefix[] = PROTECTED_PREFIXES,
): Promise<Response> {
  // NOTE: for pure static-asset requests Cloudflare reports functionPath as
  // "/", so the real path must come from the request URL.
  const path = (() => {
    try {
      return new URL(context.request.url).pathname;
    } catch {
      return context.functionPath || "/";
    }
  })();

  // Let CORS preflights through — they carry no credentials by spec.
  if (context.request.method === "OPTIONS") return context.next();

  for (const page of protectedPrefixes) {
    if (path === page.prefix || path.startsWith(page.prefix + "/") ||
        path === page.prefix.replace(/\/$/, "") + ".json") {
      const auth = context.request.headers.get("Authorization");
      if (!checkCreds(auth, page, context.env)) {
        return unauthorized(page.realm);
      }
      break;
    }
  }

  return context.next();
}
