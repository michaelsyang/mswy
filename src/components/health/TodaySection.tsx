import type { Baselines, HealthDay } from '../../lib/types'
import { fmt, fmtSteps, getReadinessColor, getReadinessLabel, generateNarrative } from '../../lib/health-utils'

interface TodaySectionProps {
  day: HealthDay | null
  baselines: Baselines
  displayIndex: number
  allDays: HealthDay[]
}

export default function TodaySection({ day, baselines, displayIndex, allDays }: TodaySectionProps) {
  if (!day) {
    return (
      <section className="today-section">
        <p style={{ color: 'var(--muted)' }}>No data available.</p>
      </section>
    )
  }

  const r = day.readiness
  const readinessColor = getReadinessColor(r)
  const readinessLabel = getReadinessLabel(r)

  // Readiness ring arc
  const circumference = 2 * Math.PI * 42
  const arcOffset = r !== null ? circumference - (r / 100) * circumference : circumference

  // Delta vs previous day
  let deltaStr = ''
  let deltaClass = ''
  if (displayIndex > 0 && r !== null) {
    const prevR = allDays[displayIndex - 1].readiness
    if (prevR !== null) {
      const delta = r - prevR
      const sign = delta > 0 ? '↑' : delta < 0 ? '↓' : '—'
      deltaStr = `${sign} ${Math.abs(delta).toFixed(0)} vs yesterday`
      deltaClass = delta > 0 ? 'delta-good' : delta < 0 ? 'delta-bad' : ''
    }
  }

  // Date label
  const dateObj = new Date(day.date + 'T00:00:00')
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' })
  const dayNum = dateObj.getDate()

  // Sleep sub
  const sleep = day.sleep_hours
  let sleepSub = ''
  let sleepSubClass = ''
  if (sleep !== null && baselines.sleep_avg) {
    const delta = sleep - baselines.sleep_avg
    const sign = delta > 0 ? '↑' : delta < 0 ? '↓' : '—'
    sleepSub = `${sign} ${Math.abs(delta).toFixed(1)}h vs avg ${baselines.sleep_avg}h`
    sleepSubClass = delta > 0 ? 'delta-good' : delta < 0 ? 'delta-bad' : ''
  }

  // Steps sub
  let stepsSub = ''
  if (day.steps !== null) {
    const goalPct = ((day.steps / 10000) * 100).toFixed(0)
    stepsSub = `${goalPct}% of 10k goal`
  }

  // HRV sub
  const hrv = day.hrv
  let hrvSub = ''
  let hrvSubClass = ''
  if (hrv !== null && baselines.hrv_avg) {
    const delta = hrv - baselines.hrv_avg
    const sign = delta > 0 ? '↑' : delta < 0 ? '↓' : '—'
    hrvSub = `${sign} ${Math.abs(delta).toFixed(1)} vs ${baselines.hrv_avg}ms`
    hrvSubClass = delta > 0 ? 'delta-good' : delta < 0 ? 'delta-bad' : ''
  }

  // RHR sub (inverted: lower is better)
  const rhr = day.rhr
  let rhrSub = ''
  let rhrSubClass = ''
  if (rhr !== null && baselines.rhr_avg) {
    const delta = rhr - baselines.rhr_avg
    const sign = delta > 0 ? '↑' : delta < 0 ? '↓' : '—'
    rhrSub = `${sign} ${Math.abs(delta).toFixed(0)} vs ${baselines.rhr_avg}bpm`
    rhrSubClass = delta < 0 ? 'delta-good' : delta > 0 ? 'delta-bad' : ''
  }

  // Readiness contributors — true per-factor point contributions from compute_readiness.
  // score = 80 neutral baseline (base 15 + HRV 20 + RHR 25 + Sleep 20 midpoints)
  //       + sum(signed contributions). Positive = helped, negative = hurt.
  const NEUTRAL_BASE = 80
  const factors = [
    { name: 'HRV', contrib: day.readiness_contrib_hrv, unit: '%', delta: day.readiness_hrv_delta, isDeltaPct: true },
    { name: 'RHR', contrib: day.readiness_contrib_rhr, unit: 'bpm', delta: day.readiness_rhr_delta, isDeltaPct: false },
    { name: 'Sleep', contrib: day.readiness_contrib_sleep, unit: '%', delta: day.readiness_sleep_eff, isDeltaPct: false },
    { name: 'Load', contrib: day.readiness_contrib_load, unit: 'kcal', delta: day.readiness_training_load, isDeltaPct: false },
  ]
  const hasContrib = factors.some((f) => f.contrib !== null)
  const totalPos = factors.reduce((s, f) => s + (f.contrib !== null && f.contrib > 0 ? f.contrib : 0), 0)
  const totalNeg = factors.reduce((s, f) => s + (f.contrib !== null && f.contrib < 0 ? Math.abs(f.contrib) : 0), 0)
  const span = Math.max(totalPos, totalNeg, 1) // half-bar scale, symmetric around neutral

  // Narrative
  const bullets = generateNarrative(day, baselines)

  return (
    <section className="today-section">
      <div className="today-date-label">
        {day.day_name} {monthName} {dayNum}
      </div>
      <div className="today-grid">
        <div className="today-readiness">
          <div className="readiness-ring">
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={readinessColor}
                strokeWidth="6"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                strokeDasharray={circumference}
                strokeDashoffset={arcOffset}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <div className="readiness-score" style={{ color: readinessColor }}>
                {r !== null ? fmt(r, 0) : '—'}
              </div>
            </div>
          </div>
          <div className="readiness-label">⚡ {readinessLabel}</div>
          <div className={`readiness-delta ${deltaClass}`}>{deltaStr}</div>
        </div>
        <div className="today-mini-grid">
          <div className="mini-card">
            <div className="mc-label">🌙 Sleep</div>
            <div className="mc-value">
              {sleep !== null ? fmt(sleep, 1) : '—'} <span className="unit">h</span>
            </div>
            <div className={`mc-sub ${sleepSubClass}`}>{sleepSub}</div>
          </div>
          <div className="mini-card">
            <div className="mc-label">👣 Steps</div>
            <div className="mc-value">{day.steps !== null ? fmtSteps(day.steps) : '—'}</div>
            <div className="mc-sub">{stepsSub}</div>
          </div>
          <div className="mini-card">
            <div className="mc-label">❤️ HRV</div>
            <div className="mc-value">
              {hrv !== null ? fmt(hrv, 0) : '—'} <span className="unit">ms</span>
            </div>
            <div className={`mc-sub ${hrvSubClass}`}>{hrvSub}</div>
          </div>
          <div className="mini-card">
            <div className="mc-label">⚡ RHR</div>
            <div className="mc-value">
              {rhr !== null ? fmt(rhr, 0) : '—'} <span className="unit">bpm</span>
            </div>
            <div className={`mc-sub ${rhrSubClass}`}>{rhrSub}</div>
          </div>
        </div>
      </div>
      <div className="readiness-breakdown">
        <div className="breakdown-header">
          <span>Readiness Contributors</span>
          <span>{`{score} = ${NEUTRAL_BASE} baseline + contributions`}</span>
        </div>
        <div className="breakdown-bar">
          {!hasContrib ? (
            <div className="breakdown-empty">No contribution data</div>
          ) : (
            <div className="breakdown-inner">
              <div className="breakdown-side breakdown-side-neg">
                {factors
                  .filter((f) => f.contrib !== null && f.contrib < 0)
                  .map((f, i) => {
                    const w = (Math.abs(f.contrib!) / span) * 100
                    return (
                      <div key={`neg-${i}`} className="breakdown-segment" style={{ width: `${w}%`, background: 'var(--danger)' }} title={`${f.name}: ${Math.round(f.contrib!)} pts`} />
                    )
                  })}
              </div>
              <div className="breakdown-neutral" title="Neutral baseline (80)" />
              <div className="breakdown-side breakdown-side-pos">
                {factors
                  .filter((f) => f.contrib !== null && f.contrib > 0)
                  .map((f, i) => {
                    const w = (Math.abs(f.contrib!) / span) * 100
                    return (
                      <div key={`pos-${i}`} className="breakdown-segment" style={{ width: `${w}%`, background: 'var(--success)' }} title={`${f.name}: +${Math.round(f.contrib!)} pts`} />
                    )
                  })}
              </div>
            </div>
          )}
        </div>
        <div className="breakdown-factors">
          {factors.map((f, i) => {
            const isHelping = f.contrib !== null && f.contrib > 0
            const isHurting = f.contrib !== null && f.contrib < 0
            const color = isHelping ? 'var(--success)' : isHurting ? 'var(--danger)' : 'var(--muted)'
            const pts = f.contrib !== null ? `${f.contrib > 0 ? '+' : ''}${Math.round(f.contrib)}` : '—'
            const deltaLabel =
              f.delta !== null
                ? `${f.delta >= 0 ? '+' : ''}${Math.round(f.delta)}${f.unit}`
                : 'N/A'
            return (
              <div key={i} className="breakdown-factor">
                <div className="breakdown-factor-name">{f.name}</div>
                <div className="breakdown-factor-val" style={{ color }}>
                  <span className="breakdown-factor-pts">{pts}</span> <span className="breakdown-factor-delta">({deltaLabel})</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="narrative-card">
        <div className="narrative-text">
          {bullets.length > 0 ? (
            <ul className="narrative-list">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
              No readiness data. Sync your watch to update.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
