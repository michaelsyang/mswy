/**
 * Root middleware for mswy.xyz — runs in front of every request, including
 * static assets (data.json, coach.json, /test/* files), not just Functions.
 *
 * Delegates to the shared auth component in functions/lib/auth.ts, which
 * checks the path against PROTECTED_PREFIXES and enforces per-page HTTP Basic
 * Auth using credentials from Pages project env vars (secrets).
 *
 * To protect a new page: add its prefix + env var names to PROTECTED_PREFIXES
 * in functions/lib/auth.ts, then set the secrets on the Pages project:
 *   npx wrangler pages secret put TEST_USER --project-name mswy
 *   npx wrangler pages secret put TEST_PASSWORD --project-name mswy
 */
import { basicAuthGate } from "./lib/auth";

export const onRequest = (context: Parameters<typeof basicAuthGate>[0]) =>
  basicAuthGate(context);
