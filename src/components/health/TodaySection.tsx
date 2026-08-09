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

  // Readiness contributors (Oura-style breakdown)
  const hrvContrib = day.readiness_hrv_delta !== null ? day.readiness_hrv_delta : 0
  const rhrContrib = day.readiness_rhr_delta !== null ? -day.readiness_rhr_delta * 4 : 0
  const sleepContrib = day.readiness_sleep_eff !== null ? day.readiness_sleep_eff - 90 : 0
  const loadContrib = day.readiness_training_load !== null ? -day.readiness_training_load / 8 : 0

  const contributors = [
    { name: 'HRV', val: hrvContrib, label: day.readiness_hrv_delta !== null ? `${day.readiness_hrv_delta >= 0 ? '+' : ''}${Math.round(day.readiness_hrv_delta)}%` : 'N/A' },
    { name: 'RHR', val: rhrContrib, label: day.readiness_rhr_delta !== null ? `${day.readiness_rhr_delta >= 0 ? '+' : ''}${Math.round(day.readiness_rhr_delta)} bpm` : 'N/A' },
    { name: 'Sleep', val: sleepContrib, label: day.readiness_sleep_eff !== null ? `${Math.round(day.readiness_sleep_eff)}%` : 'N/A' },
    { name: 'Load', val: loadContrib, label: day.readiness_training_load !== null ? `${Math.round(day.readiness_training_load)}` : 'N/A' },
  ]
  const totalAbs = contributors.reduce((sum, f) => sum + Math.abs(f.val), 0)

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
          <span>Impact Allocation</span>
        </div>
        <div className="breakdown-bar">
          {totalAbs === 0 ? (
            <div className="breakdown-empty">No contribution data</div>
          ) : (
            contributors.map((f, i) => {
              const pct = totalAbs > 0 ? (Math.abs(f.val) / totalAbs) * 100 : 0
              if (pct === 0) return null
              const color = f.val >= 0 ? 'var(--success)' : 'var(--danger)'
              return <div key={i} className="breakdown-segment" style={{ width: `${pct}%`, background: color }} title={`${f.name}: ${f.label}`} />
            })
          )}
        </div>
        <div className="breakdown-factors">
          {contributors.map((f, i) => {
            const isPositive = f.val >= 0
            const color = isPositive ? 'var(--success)' : 'var(--danger)'
            return (
              <div key={i} className="breakdown-factor">
                <div className="breakdown-factor-name">{f.name}</div>
                <div className="breakdown-factor-val" style={{ color }}>{f.label}</div>
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
