import { useEffect, useRef } from 'react'
import type { HealthDay } from '../../lib/types'
import { svgEl, makeResponsive } from '../../lib/svg-utils'
import { calcAvg } from '../../lib/health-utils'
import { useTooltip, type TooltipRow } from '../health/TooltipProvider'

interface Spo2ChartProps {
  days: HealthDay[]
  allDays: HealthDay[]
  selectedDayIndex: number
  onDaySelect: (index: number) => void
}

export default function Spo2Chart({ days, allDays, selectedDayIndex, onDaySelect }: Spo2ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { show, hide } = useTooltip()

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.innerHTML = ''

    const W = 420,
      H = 140
    const padL = 30,
      padR = 8,
      padT = 10,
      padB = 25
    const chartW = W - padL - padR
    const chartH = H - padT - padB
    makeResponsive(svg, W, H)

    const hasData = days.some((d) => d.spo2_avg !== null && d.spo2_avg !== undefined)
    if (!hasData) {
      svg.innerHTML =
        '<text x="50%" y="50%" text-anchor="middle" fill="var(--muted)" font-size="13">No SpO₂ data</text>'
      return
    }

    const minSp = 88,
      maxSp = 100
    const xStep = chartW / Math.max(days.length - 1, 1)

    // Y axis
    ;[90, 95, 100].forEach((v) => {
      const y = padT + chartH - ((v - minSp) / (maxSp - minSp)) * chartH
      svg.appendChild(
        svgEl('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: 'var(--border-soft)', 'stroke-width': 0.5 }),
      )
      const t = svgEl('text', { x: padL - 4, y: y + 3, 'text-anchor': 'end', class: 'axis-text' })
      t.textContent = v + '%'
      svg.appendChild(t)
    })

    // Line
    let path = ''
    days.forEach((d, i) => {
      if (d.spo2_avg === null || d.spo2_avg === undefined) return
      const x = padL + i * xStep
      const y = padT + chartH - ((d.spo2_avg - minSp) / (maxSp - minSp)) * chartH
      path += (path ? 'L' : 'M') + x + ',' + y
    })

    if (path) {
      svg.appendChild(
        svgEl('path', { d: path, fill: 'none', stroke: 'var(--meta)', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
      )

      // Dots with min-max range
      days.forEach((d, i) => {
        if (d.spo2_avg === null || d.spo2_avg === undefined) return
        const x = padL + i * xStep
        const y = padT + chartH - ((d.spo2_avg - minSp) / (maxSp - minSp)) * chartH

        // Range bar
        if (d.spo2_min !== null && d.spo2_max !== null) {
          const yMin = padT + chartH - ((d.spo2_min - minSp) / (maxSp - minSp)) * chartH
          const yMax = padT + chartH - ((d.spo2_max - minSp) / (maxSp - minSp)) * chartH
          svg.appendChild(
            svgEl('line', { x1: x, y1: yMin, x2: x, y2: yMax, stroke: 'var(--meta)', 'stroke-width': 1, opacity: 0.3 }),
          )
        }

        svg.appendChild(
          svgEl('circle', { cx: x, cy: y, r: 4, fill: 'var(--meta)', stroke: 'var(--bg)', 'stroke-width': 1 }),
        )
      })
    }

    // X labels + guide lines + hit areas
    const colW = chartW / Math.max(days.length, 1)
    days.forEach((d, i) => {
      if (i % Math.ceil(days.length / 6) === 0 || i === days.length - 1) {
        const x = padL + i * xStep
        const t = svgEl('text', { x, y: H - 8, 'text-anchor': 'middle', class: 'axis-text' })
        t.textContent = d.short_date
        svg.appendChild(t)
      }

      if (selectedDayIndex >= 0 && allDays.indexOf(d) === selectedDayIndex) {
        svg.appendChild(
          svgEl('line', {
            x1: padL + i * xStep,
            y1: padT,
            x2: padL + i * xStep,
            y2: padT + chartH,
            class: 'guide-line',
          }),
        )
      }

      // Transparent hit area for tooltip + day selection
      const hitArea = svgEl('rect', {
        x: padL + i * xStep - colW / 2,
        y: padT,
        width: colW,
        height: chartH,
        fill: 'transparent',
        style: 'cursor: pointer',
      })
      hitArea.addEventListener('pointerdown', (e: PointerEvent) => {
        e.preventDefault()
        const idx = allDays.indexOf(d)
        if (idx >= 0) onDaySelect(idx)
        const rows: TooltipRow[] = [
          { label: 'SpO₂ Average', value: d.spo2_avg !== null ? `${d.spo2_avg.toFixed(1)}%` : 'No data' },
          { label: 'SpO₂ Range', value: d.spo2_min !== null ? `${d.spo2_min}% – ${d.spo2_max}%` : '—' },
        ]
        show(e.clientX, e.clientY, d.date, rows)
      })
      svg.appendChild(hitArea)
    })
  }, [days, allDays, selectedDayIndex, onDaySelect, show])

  useEffect(() => {
    hide()
  }, [selectedDayIndex, hide])

  const avgSp = calcAvg(days.map((d) => d.spo2_avg))

  return (
    <div className="chart-group spo2-card">
      <div className="chart-header">
        <div className="chart-title">🩸 SpO₂</div>
        <div className="chart-meta">avg {avgSp ? avgSp.toFixed(1) + '%' : '—'}</div>
      </div>
      <svg className="chart-svg" ref={svgRef} />
    </div>
  )
}
