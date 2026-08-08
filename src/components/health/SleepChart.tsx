import { useEffect, useRef } from 'react'
import type { HealthDay } from '../../lib/types'
import { svgEl, makeResponsive } from '../../lib/svg-utils'
import { calcAvg, calcPreviousAvg } from '../../lib/health-utils'

interface SleepChartProps {
  days: HealthDay[]
  allDays: HealthDay[]
  currentRange: number
  selectedDayIndex: number
}

export default function SleepChart({ days, allDays, currentRange, selectedDayIndex }: SleepChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const legendRef = useRef<HTMLDivElement>(null)

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
          svg.appendChild(svgEl('rect', { x, y: yOffset, width: barW, height: Math.max(segH, 0.5), fill: seg.color, rx: 0 }))
        }
      })

      // X label
      if (i % Math.max(1, Math.ceil(days.length / 7)) === 0 || i === days.length - 1) {
        const t = svgEl('text', { x: x + barW / 2, y: H - 8, 'text-anchor': 'middle', class: 'axis-text' })
        t.textContent = d.short_date
        svg.appendChild(t)
      }

      // Guide line
      if (selectedDayIndex >= 0 && allDays.indexOf(d) === selectedDayIndex) {
        svg.appendChild(svgEl('line', { x1: x + barW / 2, y1: padT, x2: x + barW / 2, y2: padT + chartH, class: 'guide-line' }))
      }
    })

    // Legend
    const legend = legendRef.current
    if (legend) {
      legend.innerHTML = ''
      const deepAvg = calcAvg(days.map((d) => (d.stage_summary?.deep || 0) / 60))
      const remAvg = calcAvg(days.map((d) => (d.stage_summary?.rem || 0) / 60))
      const lightAvg = calcAvg(days.map((d) => (d.stage_summary?.light || 0) / 60))

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
  }, [days, allDays, currentRange, selectedDayIndex])

  const avgSleep = calcAvg(days.map((d) => d.sleep_hours))

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
