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
