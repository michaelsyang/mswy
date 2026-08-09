import { useEffect, useRef } from 'react'
import type { HealthDay } from '../../lib/types'
import { svgEl } from '../../lib/svg-utils'
import { calcAvg, calcPreviousAvg } from '../../lib/health-utils'
import { useTooltip, type TooltipRow } from '../health/TooltipProvider'

interface SleepChartProps {
  days: HealthDay[]
  allDays: HealthDay[]
  currentRange: number
  selectedDayIndex: number
  onDaySelect: (index: number) => void
}

/** Parse "HH:MM" (24h PT) to hours-after-11pm offset.
 *  23:00 → 0, 00:00 → 1, 01:30 → 2.5, 11:00 → 12
 *  For start times, evening-before-11pm wraps negative: 22:30 → -0.5
 */
function parseTimeOffset(timeStr: string | null, isStart = false): number | null {
  if (!timeStr) return null
  const parts = timeStr.split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m)) return null
  let offset: number
  if (h >= 23) {
    offset = (h - 23) + m / 60
  } else {
    offset = (h + 1) + m / 60
  }
  if (isStart && offset > 14) offset -= 24
  return offset
}

/** Convert hours-after-11pm offset to readable label: 0 → "11pm", 1 → "12am", 12 → "11am" */
function offsetToLabel(offset: number): string {
  let totalMin = Math.round(offset * 60) + 23 * 60
  totalMin = ((totalMin % (24 * 60)) + (24 * 60)) % (24 * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  const period = h < 12 || h === 0 ? 'am' : 'pm'
  let displayH: number
  if (h === 0) displayH = 12
  else if (h > 12) displayH = h - 12
  else displayH = h
  if (m === 0) return `${displayH}${period}`
  return `${displayH}:${String(m).padStart(2, '0')}${period}`
}

export default function SleepChart({ days, allDays, currentRange, selectedDayIndex, onDaySelect }: SleepChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const legendRef = useRef<HTMLDivElement>(null)
  const { show, hide } = useTooltip()

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.innerHTML = ''

    const hasData = days.some((d) => d.sleep_hours !== null && d.sleep_start_pt)
    if (!hasData) {
      svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="var(--muted)" font-size="13">No sleep data</text>'
      return
    }

    // Dynamic Y axis: default 11pm (offset 0) to 11am (offset 12)
    let yMin = 0
    let yMax = 12

    days.forEach((d) => {
      const start = parseTimeOffset(d.sleep_start_pt, true)
      const end = parseTimeOffset(d.sleep_end_pt, false)
      if (start !== null && start < yMin) yMin = Math.floor(start)
      if (end !== null && end > yMax) yMax = Math.ceil(end)
    })

    const yRange = yMax - yMin

    // Dimensions
    const padL = 38, padR = 10, padT = 12, padB = 25
    const minDayWidth = 28
    const containerW = scrollRef.current?.clientWidth || 380
    const availW = Math.max(containerW - padL - padR, 100)
    const daySlot = Math.max(minDayWidth, availW / Math.max(days.length, 1))
    const totalChartW = daySlot * days.length
    const W = padL + padR + totalChartW
    const H = 220
    const chartH = H - padT - padB

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svg.style.minWidth = '100%'
    svg.style.width = `${W}px`

    // Y axis grid + labels (every 2 hours)
    const yStep = 2
    const yStart = Math.floor(yMin / yStep) * yStep
    const yEnd = Math.ceil(yMax / yStep) * yStep

    for (let t = yStart; t <= yEnd; t += yStep) {
      const y = padT + chartH - ((t - yMin) / yRange) * chartH
      svg.appendChild(svgEl('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: 'var(--border-soft)', 'stroke-width': 0.5 }))
      const label = svgEl('text', { x: padL - 4, y: y + 3, 'text-anchor': 'end', class: 'axis-text' })
      label.textContent = offsetToLabel(t)
      svg.appendChild(label)
    }

    // Target sleep window highlight (11pm–11am = offset 0–12) if within view
    const targetTop = padT + chartH - ((12 - yMin) / yRange) * chartH
    const targetBot = padT + chartH - ((0 - yMin) / yRange) * chartH
    if (yMin <= 0 && yMax >= 12) {
      svg.appendChild(svgEl('rect', {
        x: padL, y: targetTop, width: W - padL - padR, height: targetBot - targetTop,
        fill: 'var(--sleep-window, rgba(100,130,255,0.04))',
        'pointer-events': 'none',
      }))
    }

    const barW = daySlot * 0.65
    const gap = daySlot * 0.35

    days.forEach((d, i) => {
      const x = padL + i * daySlot + gap / 2
      const start = parseTimeOffset(d.sleep_start_pt, true)
      const end = parseTimeOffset(d.sleep_end_pt, false)

      // X label (always show for all days if ≤14, else every few)
      const labelEvery = Math.max(1, Math.ceil(days.length / 7))
      if (i % labelEvery === 0 || i === days.length - 1) {
        const t = svgEl('text', { x: x + barW / 2, y: H - 8, 'text-anchor': 'middle', class: 'axis-text' })
        t.textContent = d.short_date
        svg.appendChild(t)
      }

      if (start === null || end === null) return

      const stages = d.stage_summary || {}
      const deep = (stages.deep || 0) / 60
      const rem = (stages.rem || 0) / 60
      const light = (stages.light || 0) / 60
      const awake = (stages.awake || 0) / 60
      const totalStageH = deep + rem + light + awake
      const actualSleepH = end - start
      const scaleFactor = totalStageH > 0 ? actualSleepH / totalStageH : 1

      const isFlagged = !!d.data_quality
      const barOpacity = isFlagged ? 0.2 : 1.0

      // Bar bottom = Y(start), stack upward toward Y(end)
      let yOffset = padT + chartH - ((start - yMin) / yRange) * chartH

      const segments = [
        { val: deep * scaleFactor, color: 'var(--sleep-deep)' },
        { val: rem * scaleFactor, color: 'var(--sleep-rem)' },
        { val: light * scaleFactor, color: 'var(--sleep-light)' },
        { val: awake * scaleFactor, color: 'var(--sleep-awake)' },
      ]

      segments.forEach((seg) => {
        if (seg.val > 0) {
          const segH = (seg.val / yRange) * chartH
          yOffset -= segH
          svg.appendChild(svgEl('rect', { x, y: yOffset, width: barW, height: Math.max(segH, 0.5), fill: seg.color, rx: 0, opacity: barOpacity }))
        }
      })

      // Data quality warning
      if (isFlagged) {
        const warn = svgEl('text', { x: x + barW / 2, y: padT + 8, 'text-anchor': 'middle', 'font-size': 10, fill: 'var(--warn, #e88)' })
        warn.textContent = '⚠'
        svg.appendChild(warn)
      }

      // Guide line
      if (selectedDayIndex >= 0 && allDays.indexOf(d) === selectedDayIndex) {
        svg.appendChild(svgEl('line', { x1: x + barW / 2, y1: padT, x2: x + barW / 2, y2: padT + chartH, class: 'guide-line' }))
      }

      // Hit area
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
        <div className="sleep-chart-scroll" ref={scrollRef}>
          <svg className="chart-svg" ref={svgRef} />
        </div>
        <div className="sleep-legend" ref={legendRef} />
      </div>
    </div>
  )
}
