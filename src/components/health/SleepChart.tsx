import { useEffect, useRef } from 'react'
import type { HealthDay } from '../../lib/types'
import { svgEl, makeResponsive } from '../../lib/svg-utils'
import { calcAvg, calcPreviousAvg } from '../../lib/health-utils'
import { useTooltip, type TooltipRow } from '../health/TooltipProvider'

interface SleepChartProps {
  days: HealthDay[]
  allDays: HealthDay[]
  currentRange: number
  selectedDayIndex: number
  onDaySelect: (index: number) => void
}

export default function SleepChart({ days, allDays, currentRange, selectedDayIndex, onDaySelect }: SleepChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const legendRef = useRef<HTMLDivElement>(null)
  const { show, hide } = useTooltip()

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.innerHTML = ''

    const hasData = days.some((d) => d.sleep_hours !== null)
    if (!hasData) {
      svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="var(--muted)" font-size="13">No sleep data</text>'
      return
    }

    const W = 420, H = 200
    const padL = 30, padR = 8, padT = 10, padB = 25
    const chartW = W - padL - padR
    const chartH = H - padT - padB
    makeResponsive(svg, W, H)

    const maxY = 11
    const barW = (chartW / days.length) * 0.7
    const gap = (chartW / days.length) * 0.3

    // Y axis
    for (let h = 0; h <= maxY; h += 3) {
      const y = padT + chartH - (h / maxY) * chartH
      svg.appendChild(svgEl('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: 'var(--border-soft)', 'stroke-width': 0.5 }))
      const t = svgEl('text', { x: padL - 4, y: y + 3, 'text-anchor': 'end', class: 'axis-text' })
      t.textContent = h + 'h'
      svg.appendChild(t)
    }

    // Stacked bars
    days.forEach((d, i) => {
      const x = padL + i * (barW + gap) + gap / 2
      const stages = d.stage_summary || {}
      const deep = (stages.deep || 0) / 60
      const rem = (stages.rem || 0) / 60
      const light = (stages.light || 0) / 60
      const awake = (stages.awake || 0) / 60

      const isFlagged = !!d.data_quality
      const barOpacity = isFlagged ? 0.2 : 1.0

      let yOffset = padT + chartH
      const segments = [
        { val: deep, color: 'var(--sleep-deep)' },
        { val: rem, color: 'var(--sleep-rem)' },
        { val: light, color: 'var(--sleep-light)' },
        { val: awake, color: 'var(--sleep-awake)' },
      ]

      segments.forEach((seg) => {
        if (seg.val > 0) {
          const segH = (seg.val / maxY) * chartH
          yOffset -= segH
          svg.appendChild(svgEl('rect', { x, y: yOffset, width: barW, height: Math.max(segH, 0.5), fill: seg.color, rx: 0, opacity: barOpacity }))
        }
      })

      // X label
      if (i % Math.max(1, Math.ceil(days.length / 7)) === 0 || i === days.length - 1) {
        const t = svgEl('text', { x: x + barW / 2, y: H - 8, 'text-anchor': 'middle', class: 'axis-text' })
        t.textContent = d.short_date
        svg.appendChild(t)
      }

      // Data quality indicator for flagged days
      if (isFlagged) {
        const warn = svgEl('text', { x: x + barW / 2, y: padT + 8, 'text-anchor': 'middle', 'font-size': 10, fill: 'var(--warn, #e88)' })
        warn.textContent = '⚠'
        svg.appendChild(warn)
      }

      // Guide line
      if (selectedDayIndex >= 0 && allDays.indexOf(d) === selectedDayIndex) {
        svg.appendChild(svgEl('line', { x1: x + barW / 2, y1: padT, x2: x + barW / 2, y2: padT + chartH, class: 'guide-line' }))
      }

      // Transparent hit area for tooltip + day selection
      const hitArea = svgEl('rect', {
        x: x - gap / 2,
        y: padT,
        width: barW + gap,
        height: chartH,
        fill: 'transparent',
        style: 'cursor: pointer',
      })
      hitArea.addEventListener('pointerdown', (e: PointerEvent) => {
        e.preventDefault()
        const idx = allDays.indexOf(d)
        if (idx >= 0) onDaySelect(idx)
        const rows: TooltipRow[] = [
          { label: 'Readiness', value: d.readiness !== null ? `${Math.round(d.readiness)}/100` : '—' },
          { label: 'Sleep Hours', value: d.sleep_hours !== null ? `${d.sleep_hours.toFixed(1)}h` : '—' },
          { label: 'Sleep Efficiency', value: d.sleep_efficiency !== null ? `${Math.round(d.sleep_efficiency)}%` : '—' },
          { label: 'Deep Sleep', value: d.sleep_deep_min !== null ? `${Math.round(d.sleep_deep_min)}m` : '—' },
          { label: 'REM Sleep', value: d.sleep_rem_min !== null ? `${Math.round(d.sleep_rem_min)}m` : '—' },
          { label: 'Light Sleep', value: d.sleep_light_min !== null ? `${Math.round(d.sleep_light_min)}m` : '—' },
          { label: 'Awake Time', value: d.sleep_awake_min !== null ? `${Math.round(d.sleep_awake_min)}m` : '—' },
          { label: 'Bedtime', value: d.sleep_start_pt || '—' },
          { label: 'Wake Time', value: d.sleep_end_pt || '—' },
        ]
        show(e.clientX, e.clientY, d.date, rows)
      })
      svg.appendChild(hitArea)
    })

    // Legend
    const legend = legendRef.current
    if (legend) {
      legend.innerHTML = ''
      const validDays = days.filter((d) => !d.data_quality)
      const deepAvg = calcAvg(validDays.map((d) => (d.stage_summary?.deep || 0) / 60))
      const remAvg = calcAvg(validDays.map((d) => (d.stage_summary?.rem || 0) / 60))
      const lightAvg = calcAvg(validDays.map((d) => (d.stage_summary?.light || 0) / 60))

      const prevDeep = calcPreviousAvg(allDays, 'sleep_deep_min', currentRange)
      const prevRem = calcPreviousAvg(allDays, 'sleep_rem_min', currentRange)
      const prevLight = calcPreviousAvg(allDays, 'sleep_light_min', currentRange)

      const legendItems = [
        { name: 'Deep', avg: deepAvg, prev: prevDeep ? prevDeep / 60 : null, color: 'var(--sleep-deep)' },
        { name: 'Light', avg: lightAvg, prev: prevLight ? prevLight / 60 : null, color: 'var(--sleep-light)' },
        { name: 'REM', avg: remAvg, prev: prevRem ? prevRem / 60 : null, color: 'var(--sleep-rem)' },
      ]

      legendItems.forEach((item) => {
        const div = document.createElement('div')
        div.className = 'sleep-legend-item'
        let changeStr = ''
        if (item.avg !== null && item.prev !== null) {
          const change = item.avg - item.prev
          if (Math.abs(change) >= 0.05) {
            const sign = change > 0 ? '+' : ''
            changeStr = `${sign}${change.toFixed(1)}h vs prev`
          }
        }
        div.innerHTML = `
          <div class="sl-color" style="background:${item.color}"></div>
          <div class="sl-name">${item.name}</div>
          <div class="sl-avg">${item.avg ? item.avg.toFixed(1) + 'h' : '—'}</div>
          ${changeStr ? `<div class="sl-change">${changeStr}</div>` : ''}
        `
        legend.appendChild(div)
      })
    }
  }, [days, allDays, currentRange, selectedDayIndex, onDaySelect, show])

  // Hide tooltip when selection changes or data updates
  useEffect(() => {
    hide()
  }, [selectedDayIndex, currentRange, hide])

  const validSleepDays = days.filter((d) => !d.data_quality)
  const avgSleep = calcAvg(validSleepDays.map((d) => d.sleep_hours))

  return (
    <div className="chart-group">
      <div className="chart-header">
        <div className="chart-title">🌙 Sleep</div>
        <div className="chart-meta">avg {avgSleep ? avgSleep.toFixed(1) + 'h' : '—'}</div>
      </div>
      <div className="sleep-layout">
        <div className="sleep-chart-area">
          <svg className="chart-svg" ref={svgRef} />
        </div>
        <div className="sleep-legend" ref={legendRef} />
      </div>
    </div>
  )
}
