import type { Baselines, HealthDay } from './types'

/** Format a number with fixed decimals, or em-dash for null */
export function fmt(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined) return '—'
  return Number(n).toFixed(decimals)
}

/** Format steps as k */
export function fmtSteps(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

/** Average of non-null values in an array */
export function calcAvg(arr: (number | null | undefined)[]): number | null {
  const valid = arr.filter((v): v is number => v !== null && v !== undefined)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

/** Average of a field for the previous period (same length, shifted back) */
export function calcPreviousAvg(
  days: HealthDay[],
  field: keyof HealthDay,
  range: number,
): number | null {
  const startIdx = days.length - range * 2
  if (startIdx < 0) return null
  const prevDays = days.slice(startIdx, startIdx + range)
  return calcAvg(prevDays.map((d) => d[field] as number | null))
}

/** Readiness label from score */
export function getReadinessLabel(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'No data'
  if (score >= 85) return 'Optimal'
  if (score >= 70) return 'Good'
  if (score >= 55) return 'Fair'
  return 'Recharge'
}

/** Readiness color from score */
export function getReadinessColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'var(--muted)'
  if (score >= 85) return 'var(--success)'
  if (score >= 70) return 'var(--fg)'
  if (score >= 55) return 'var(--warn)'
  return 'var(--danger)'
}

/** Color based on value vs baseline direction */
export function getColor(
  val: number | null | undefined,
  baseline: number,
  direction: 'higher_better' | 'lower_better',
): string {
  if (val === null || val === undefined) return 'var(--muted)'
  if (direction === 'higher_better') {
    if (val >= baseline * 1.1) return 'var(--success)'
    if (val <= baseline * 0.8) return 'var(--danger)'
    if (val <= baseline * 0.9) return 'var(--warn)'
    return 'var(--fg)'
  } else {
    if (val <= baseline * 0.95) return 'var(--success)'
    if (val >= baseline * 1.1) return 'var(--danger)'
    if (val >= baseline * 1.05) return 'var(--warn)'
    return 'var(--fg)'
  }
}

/** Generate narrative bullets for a day */
export function generateNarrative(day: HealthDay, baselines: Baselines): string[] {
  if (!day || day.readiness === null) {
    return []
  }

  const bullets: string[] = []
  const r = day.readiness
  const hrv = day.hrv
  const rhr = day.rhr
  const sleep = day.sleep_hours

  // HRV interpretation
  if (hrv !== null && baselines.hrv_avg) {
    const delta = hrv - baselines.hrv_avg
    if (delta < -5) bullets.push('HRV well below baseline — significant physiological stress. Prioritize rest today.')
    else if (delta < -2) bullets.push('HRV slightly below baseline — mild fatigue accumulating.')
    else if (delta > 3) bullets.push('HRV above baseline — recovery is on track.')
  }

  // RHR interpretation
  if (rhr !== null && baselines.rhr_avg) {
    const delta = rhr - baselines.rhr_avg
    if (delta > 4) bullets.push(`RHR elevated ${delta.toFixed(0)}bpm — possible dehydration, illness, or lingering strain.`)
    else if (delta > 2) bullets.push('RHR slightly above baseline — watch for accumulating fatigue.')
    else if (delta < -2) bullets.push('RHR below baseline — cardiovascular system well recovered.')
  }

  // Sleep interpretation
  if (sleep !== null) {
    if (sleep < 4) bullets.push(`Only ${sleep.toFixed(1)}h sleep — significantly short. Expect impaired recovery.`)
    else if (sleep < 6) bullets.push(`${sleep.toFixed(1)}h sleep — below the 7h target.`)
    else if (sleep >= 7.5) bullets.push(`${sleep.toFixed(1)}h sleep — solid rest.`)
  }

  // Activity context
  if (day.exercise_count > 0) {
    const exTypes = [...new Set(day.exercises.map((e) => e.type))].map((t) => t.toLowerCase())
    let actStr = `${day.exercise_count} workout${day.exercise_count > 1 ? 's' : ''} (${exTypes.join(', ')})`
    if (r < 55) actStr += ' — consider lighter activity given low readiness.'
    else if (r >= 85) actStr += ' — training load well tolerated.'
    else actStr += '.'
    bullets.push(actStr)
  }

  // Overall if nothing flagged
  if (bullets.length === 0) {
    bullets.push('Metrics within normal range. No concerns flagged.')
  }

  return bullets
}
