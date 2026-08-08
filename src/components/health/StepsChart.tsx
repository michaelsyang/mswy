import { useEffect, useRef } from 'react'
import type { HealthDay } from '../../lib/types'
import { svgEl, makeResponsive } from '../../lib/svg-utils'
import { calcAvg } from '../../lib/health-utils'

interface StepsChartProps {
  days: HealthDay[]
  allDays: HealthDay[]
  selectedDayIndex: number
}

export default function StepsChart({ days, allDays, selectedDayIndex }: StepsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.innerHTML = ''

    const W = 420, H = 160
    const padL = 30, padR = 8, padT = 10, padB = 25
    const chartW = W - padL - padR
    const chartH = H - padT - padB
    makeResponsive(svg, W, H)

    const maxSteps = Math.max(10000, ...days.map((d) => d.steps || 0))
    const barW = (chartW / days.length) * 0.7
    const gap = (chartW / days.length) * 0.3

    // Y axis
    ;[0, 5000, 10000, 15000].forEach((s) => {
      if (s > maxSteps) return
      const y = padT + chartH - (s / maxSteps) * chartH
      svg.appendChild(svgEl('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: 'var(--border-soft)', 'stroke-width': 0.5 }))
      const t = svgEl('text', { x: padL - 4, y: y + 3, 'text-anchor': 'end', class: 'axis-text' })
      t.textContent = s >= 1000 ? s / 1000 + 'k' : String(s)
      svg.appendChild(t)
    })

    // Goal line at 10k
    const goalY = padT + chartH - (10000 / maxSteps) * chartH
    svg.appendChild(svgEl('line', { x1: padL, y1: goalY, x2: W - padR, y2: goalY, stroke: 'var(--accent)', 'stroke-width': 1, 'stroke-dasharray': '3 2', opacity: 0.4 }))

    days.forEach((d, i) => {
      const x = padL + i * (barW + gap) + gap / 2
      const steps = d.steps || 0
      const barH = (steps / maxSteps) * chartH
      const color = steps >= 10000 ? 'var(--success)' : steps >= 5000 ? 'var(--accent)' : 'var(--muted)'
      svg.appendChild(svgEl('rect', { x, y: padT + chartH - barH, width: barW, height: barH, fill: color, rx: 2, opacity: 0.85 }))

      if (i % Math.ceil(days.length / 7) === 0 || i === days.length - 1) {
        const t = svgEl('text', { x: x + barW / 2, y: H - 8, 'text-anchor': 'middle', class: 'axis-text' })
        t.textContent = d.short_date
        svg.appendChild(t)
      }

      if (selectedDayIndex >= 0 && allDays.indexOf(d) === selectedDayIndex) {
        svg.appendChild(svgEl('line', { x1: x + barW / 2, y1: padT, x2: x + barW / 2, y2: padT + chartH, class: 'guide-line' }))
      }
    })
  }, [days, allDays, selectedDayIndex])

  const avgSteps = calcAvg(days.map((d) => d.steps))

  return (
    <div className="chart-group">
      <div className="chart-header">
        <div className="chart-title">👣 Steps</div>
        <div className="chart-meta">avg {avgSteps ? Math.round(avgSteps).toLocaleString() : '—'}</div>
      </div>
      <svg className="chart-svg" ref={svgRef} />
    </div>
  )
}
