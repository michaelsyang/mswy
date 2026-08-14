import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { detectDeviceTz, resolveTz, type TzPref } from '../lib/timezones'

const STORAGE_KEY = 'health.tz.pref'

interface TimezoneCtx {
  /** Raw user preference: 'auto' | IANA tz. Defaults to 'auto'. */
  pref: TzPref
  /** Resolved IANA timezone (device tz when pref==='auto'). */
  tz: string
  /** True if the resolved tz came from auto-detection (device). */
  isAuto: boolean
  setPref: (p: TzPref) => void
}

const Ctx = createContext<TimezoneCtx | null>(null)

function readStorage(): TzPref {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as TzPref | null
    return v === 'auto' || v === 'America/Los_Angeles' || v === 'Asia/Seoul' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

/** Fire-and-forget note to the health coach bridge. Safe if endpoint absent. */
function noteToCoach(tz: string, pref: TzPref) {
  try {
    fetch('/api/tz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tz, pref, detected: detectDeviceTz(), ts: Date.now() }),
      keepalive: true,
    }).catch(() => {
      /* endpoint unavailable — dashboard still displays correctly */
    })
  } catch {
    /* ignore */
  }
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<TzPref>(readStorage)

  const tz = resolveTz(pref)
  const isAuto = pref === 'auto'
  const deviceTz = detectDeviceTz()

  // Persist + note to coach whenever the preference changes (or first load).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {
      /* ignore */
    }
    noteToCoach(tz, pref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pref])

  // On auto: if the device timezone changes while the tab is open (travel),
  // refresh without needing a reload.
  useEffect(() => {
    if (pref === 'auto') noteToCoach(tz, pref)
  }, [deviceTz, pref, tz])

  const setPref = useCallback((p: TzPref) => setPrefState(p), [])

  return <Ctx.Provider value={{ pref, tz, isAuto, setPref }}>{children}</Ctx.Provider>
}

export function useTimezone(): TimezoneCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    // Allow use without a provider (falls back to static defaults).
    return { pref: 'auto', tz: resolveTz('auto'), isAuto: true, setPref: () => {} }
  }
  return ctx
}
