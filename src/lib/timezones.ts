/**
 * Timezone handling for the health dashboard.
 *
 * The data pipeline emits sleep times BOTH as naive PT wall-clock strings
 * (sleep_start_pt / sleep_end_pt, for backward compat) AND as UTC ISO
 * (sleep_start_utc / sleep_end_utc). We render from UTC so the same instant
 * can be shown in whatever timezone the viewer is in.
 */

export type TzPref = 'auto' | 'America/Los_Angeles' | 'Asia/Seoul'

export const TZ_NAMES: Record<string, string> = {
  'America/Los_Angeles': 'PT',
  'Asia/Seoul': 'KST',
  'Pacific/Honolulu': 'HST',
  'Europe/London': 'GMT',
  'Etc/UTC': 'UTC',
}

/** Detect the viewer's timezone from the device. */
export function detectDeviceTz(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz || 'America/Los_Angeles'
  } catch {
    return 'America/Los_Angeles'
  }
}

/** Resolve a preference to an IANA timezone. */
export function resolveTz(pref: TzPref): string {
  if (pref === 'auto') {
    const d = detectDeviceTz()
    // If the device is somewhere we recognize, use it; else default to PT.
    return d || 'America/Los_Angeles'
  }
  return pref
}

/** Human label for a timezone, e.g. "PT", "KST". Falls back to city-ish name. */
export function tzLabel(tz: string): string {
  return TZ_NAMES[tz] ?? tz
}

/** Format a UTC ISO instant as "HH:MM" (24h) in the given timezone. */
export function utcToWallClock(utcIso: string | null, tz: string): string | null {
  if (!utcIso) return null
  const d = new Date(utcIso)
  if (Number.isNaN(d.getTime())) return null
  // Intl hour/minute in the target tz, then normalize to HH:MM.
  const h = d.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', hour12: false, hourCycle: 'h23' })
  const m = d.toLocaleString('en-US', { timeZone: tz, minute: '2-digit' })
  const hh = h === '24' ? '00' : h.padStart(2, '0')
  return `${hh}:${m}`
}

/** Format a UTC ISO instant as a friendly time + label, e.g. "8:51 PM (KST)". */
export function utcToFriendly(utcIso: string | null, tz: string): string | null {
  if (!utcIso) return null
  const d = new Date(utcIso)
  if (Number.isNaN(d.getTime())) return null
  const t = d.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' })
  return `${t} (${tzLabel(tz)})`
}

/**
 * Best wall-clock "HH:MM" for a day's sleep boundary in a target timezone.
 * Prefers UTC ISO (exact conversion); falls back to the naive PT string
 * (the pre-UTC data) for backward compatibility.
 */
export function sleepTime(utcIso: string | null, ptFallback: string | null, tz: string): string | null {
  const fromUtc = utcToWallClock(utcIso, tz)
  if (fromUtc) return fromUtc
  // Fallback path: legacy PT string. If target is not PT, we can't convert
  // reliably without a UTC anchor, so return the PT value as-is.
  return ptFallback
}
