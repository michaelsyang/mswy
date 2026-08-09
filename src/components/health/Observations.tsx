import { useState } from 'react'
import type { Anomaly, HealthDay } from '../../lib/types'

interface ObservationsProps {
  anomalies: Anomaly[]
  allDays: HealthDay[]
}

export default function Observations({ anomalies, allDays }: ObservationsProps) {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className={`observations-card ${collapsed ? 'collapsed' : ''}`}>
      <div className="obs-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="obs-title">⚠️ Observations & Anomalies</div>
        <div className="obs-toggle-icon">▼</div>
      </div>
      <div className="obs-body">
        {anomalies.length === 0 ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', padding: 'var(--space-2) 0' }}>
            No anomalies detected in this period.
          </div>
        ) : (
          (() => {
            // Group by date
            const grouped: Record<string, Anomaly[]> = {}
            anomalies.forEach((a) => {
              if (!grouped[a.date]) grouped[a.date] = []
              grouped[a.date].push(a)
            })

            return Object.keys(grouped)
              .sort()
              .map((date) => {
                const dayData = allDays.find((d) => d.date === date)
                const dayName = dayData ? `${dayData.day_name} ${dayData.short_date}` : date

                return grouped[date].map((a, idx) => {
                  let icon = '❤️'
                  let metricName = a.metric
                  if (a.metric === 'resting_hr') {
                    icon = '⚡'
                    metricName = 'RHR'
                  } else if (a.metric === 'hrv') {
                    icon = '❤️'
                    metricName = 'HRV'
                  }

                  const severityColor = a.severity === 'critical' ? 'var(--danger)' : 'var(--warn)'
                  const valStr = a.metric === 'hrv' ? `${a.value.toFixed(1)} ms` : `${a.value.toFixed(0)} bpm`
                  const baseStr = a.baseline !== null
                    ? a.metric === 'hrv' ? `${a.baseline.toFixed(1)} ms` : `${a.baseline.toFixed(0)} bpm`
                    : 'N/A'
                  const devPct = a.deviation_pct.toFixed(0)

                  let context = ''
                  if (dayData && dayData.exercise_count > 0) {
                    context = ` — ${dayData.exercise_count} workout${dayData.exercise_count > 1 ? 's' : ''} logged`
                  }

                  return (
                    <div className="obs-item" key={`${a.id}-${idx}`}>
                      <span className="obs-icon">{icon}</span>
                      <span>
                        <strong style={{ color: severityColor }}>
                          {metricName} {a.severity}
                        </strong>{' '}
                        on {dayName}: {valStr} vs baseline {baseStr} ({devPct}% deviation)
                        {context}
                      </span>
                    </div>
                  )
                })
              })
          })()
        )}
      </div>
    </div>
  )
}
