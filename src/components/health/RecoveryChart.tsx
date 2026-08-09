import { useEffect, useRef } from 'react'
import type { HealthDay } from '../../lib/types'
import { svgEl, makeResponsive } from '../../lib/svg-utils'
import { calcAvg } from '../../lib/health-utils'
import { useTooltip, type TooltipRow } from '../health/TooltipProvider'

interface RecoveryChartProps {
  days: HealthDay[]
  allDays: HealthDay[]
  selectedDayIndex: number
  onDaySelect: (index: number) => void
}

export default function RecoveryChart({ days, allDays, selectedDayIndex, onDaySelect }: RecoveryChartProps) {
  const dualSvgRef = useRef<SVGSVGElement>(null)
  const cvSvgRef = useRef<SVGSVGElement>(null)
  const balanceSvgRef = useRef<SVGSVGElement>(null)
  const { show, hide } = useTooltip()

  // Dual-axis HRV + RHR chart
  useEffect(() => {
    const svg = dualSvgRef.current
    if (!svg) return
    svg.innerHTML = ''

    const W = 420, H = 200
    const padL = 32, padR = 32, padT = 15, padB = 25
    const chartW = W - padL - padR
    const chartH = H - padT - padB
    makeResponsive(svg, W, H)

    const hrvVals = days.map((d) => d.hrv).filter((v): v is number => v !== null && v !== undefined)
    const rhrVals = days.map((d) => d.rhr).filter((v): v is number => v !== null && v !== undefined)
    const hrvMax = hrvVals.length ? Math.max(...hrvVals) : 30
    const hrvMin = hrvVals.length ? Math.min(...hrvVals) : 0
    const rhrMax = rhrVals.length ? Math.max(...rhrVals) : 92
    const rhrMin = rhrVals.length ? Math.min(...rhrVals) : 77
    const hrvPad = Math.max((hrvMax - hrvMin) * 0.08, 1)
    const rhrPad = Math.max((rhrMax - rhrMin) * 0.08, 1)
    const hrvYMax = hrvMax + hrvPad
    const hrvYMin = Math.max(0, hrvMin - hrvPad)
    const rhrYMax = rhrMax + rhrPad
    const rhrYMin = Math.max(0, rhrMin - rhrPad)

    const xStep = chartW / Math.max(days.length - 1, 1)

    // Y axis labels — left (HRV)
    for (let i = 0; i <= 4; i++) {
      const val = hrvYMin + (hrvYMax - hrvYMin) * (i / 4)
      const y = padT + chartH - (i / 4) * chartH
      svg.appendChild(svgEl('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: 'var(--border-soft)', 'stroke-width': 0.5 }))
      const t = svgEl('text', { x: padL - 4, y: y + 3, 'text-anchor': 'end', class: 'y-label-left' })
      t.textContent = String(Math.round(val))
      svg.appendChild(t)
    }

    // Y axis labels — right (RHR)
    for (let i = 0; i <= 4; i++) {
      const val = rhrYMin + (rhrYMax - rhrYMin) * (i / 4)
      const y = padT + chartH - (i / 4) * chartH
      const t = svgEl('text', { x: W - padR + 4, y: y + 3, 'text-anchor': 'start', class: 'y-label-right' })
      t.textContent = String(Math.round(val))
      svg.appendChild(t)
    }

    // Axis labels
    const hrvLabel = svgEl('text', { x: padL - 4, y: padT - 5, 'text-anchor': 'end', class: 'axis-label' })
    hrvLabel.textContent = 'HRV'
    hrvLabel.setAttribute('fill', 'var(--sleep-rem)')
    svg.appendChild(hrvLabel)

    const rhrLabel = svgEl('text', { x: W - padR + 4, y: padT - 5, 'text-anchor': 'start', class: 'axis-label' })
    rhrLabel.textContent = 'RHR'
    rhrLabel.setAttribute('fill', 'var(--warn)')
    svg.appendChild(rhrLabel)

    // HRV line
    let hrvPath = ''
    days.forEach((d, i) => {
      if (d.hrv === null || d.hrv === undefined) return
      const x = padL + i * xStep
      const y = padT + chartH - ((d.hrv - hrvYMin) / (hrvYMax - hrvYMin)) * chartH
      hrvPath += (hrvPath ? 'L' : 'M') + x + ',' + y
    })
    if (hrvPath) {
      svg.appendChild(svgEl('path', { d: hrvPath, fill: 'none', stroke: 'var(--sleep-rem)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }))
      days.forEach((d, i) => {
        if (d.hrv === null || d.hrv === undefined) return
        const x = padL + i * xStep
        const y = padT + chartH - ((d.hrv - hrvYMin) / (hrvYMax - hrvYMin)) * chartH
        svg.appendChild(svgEl('circle', { cx: x, cy: y, r: 4, fill: 'var(--sleep-rem)', stroke: 'var(--bg)', 'stroke-width': 1 }))
      })
    }

    // RHR line
    let rhrPath = ''
    days.forEach((d, i) => {
      if (d.rhr === null || d.rhr === undefined) return
      const x = padL + i * xStep
      const y = padT + chartH - ((d.rhr - rhrYMin) / (rhrYMax - rhrYMin)) * chartH
      rhrPath += (rhrPath ? 'L' : 'M') + x + ',' + y
    })
    if (rhrPath) {
      svg.appendChild(svgEl('path', { d: rhrPath, fill: 'none', stroke: 'var(--warn)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }))
      days.forEach((d, i) => {
        if (d.rhr === null || d.rhr === undefined) return
        const x = padL + i * xStep
        const y = padT + chartH - ((d.rhr - rhrYMin) / (rhrYMax - rhrYMin)) * chartH
        svg.appendChild(svgEl('circle', { cx: x, cy: y, r: 4, fill: 'var(--warn)', stroke: 'var(--bg)', 'stroke-width': 1 }))
      })
    }

    // X labels
    days.forEach((d, i) => {
      if (i % Math.ceil(days.length / 6) === 0 || i === days.length - 1) {
        const x = padL + i * xStep
        const t = svgEl('text', { x, y: H - 8, 'text-anchor': 'middle', class: 'axis-text' })
        t.textContent = d.short_date
        svg.appendChild(t)
      }
    })

    // Guide line
    if (selectedDayIndex >= 0) {
      const d = allDays[selectedDayIndex]
      const idx = days.indexOf(d)
      if (idx >= 0) {
        const x = padL + idx * xStep
        svg.appendChild(svgEl('line', { x1: x, y1: padT, x2: x, y2: padT + chartH, class: 'guide-line' }))
      }
    }

    // Transparent hit areas for tooltip + day selection
    const colW = xStep
    days.forEach((d, i) => {
      const x = padL + i * xStep
      const hitArea = svgEl('rect', {
        x: x - colW / 2,
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
          { label: 'HRV', value: d.hrv !== null ? `${d.hrv.toFixed(1)} ms` : 'No data' },
          { label: 'RHR', value: d.rhr !== null ? `${d.rhr.toFixed(0)} bpm` : 'No data' },
          { label: 'Readiness', value: d.readiness !== null ? `${Math.round(d.readiness)}/100` : '—' },
        ]
        show(e.clientX, e.clientY, d.date, rows)
      })
      svg.appendChild(hitArea)
    })
  }, [days, allDays, selectedDayIndex, onDaySelect, show])

  // HRV-CV bar chart
  useEffect(() => {
    const svg = cvSvgRef.current
    if (!svg) return
    svg.innerHTML = ''

    const W = 420, H = 150
    const padL = 32, padR = 8, padT = 18, padB = 20
    const chartW = W - padL - padR
    const chartH = H - padT - padB
    makeResponsive(svg, W, H)

    const cvVals = days.map((d) => d.hrv_cv).filter((v): v is number => v !== null && v !== undefined)
    if (cvVals.length === 0) {
      svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="var(--muted)" font-size="11">No HRV-CV data</text>'
      return
    }

    const maxCV = Math.max(...cvVals, 20) * 1.1
    const barW = (chartW / days.length) * 0.7
    const gap = (chartW / days.length) * 0.3

    // Title
    const title = svgEl('text', { x: padL, y: 10, class: 'axis-label' })
    title.textContent = 'HRV-CV (7-day rolling)'
    title.setAttribute('fill', 'var(--accent)')
    svg.appendChild(title)

    // Y axis
    ;[0, 10, 20].forEach((v) => {
      if (v > maxCV) return
      const y = padT + chartH - (v / maxCV) * chartH
      svg.appendChild(svgEl('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: 'var(--border-soft)', 'stroke-width': 0.5 }))
      const t = svgEl('text', { x: padL - 4, y: y + 3, 'text-anchor': 'end', class: 'axis-text' })
      t.textContent = v + '%'
      svg.appendChild(t)
    })

    days.forEach((d, i) => {
      const x = padL + i * (barW + gap) + gap / 2
      const cv = d.hrv_cv
      if (cv === null || cv === undefined) return
      const barH = (cv / maxCV) * chartH
      const color = cv > 15 ? 'var(--danger)' : cv > 10 ? 'var(--warn)' : 'var(--success)'
      svg.appendChild(svgEl('rect', { x, y: padT + chartH - barH, width: barW, height: barH, fill: color, rx: 1, opacity: 0.8 }))

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
          { label: 'HRV-CV', value: `${cv.toFixed(1)}%` },
          { label: 'HRV Range', value: d.hrv_range_low !== null ? `${d.hrv_range_low}–${d.hrv_range_high}ms` : '—' },
        ]
        show(e.clientX, e.clientY, d.date, rows)
      })
      svg.appendChild(hitArea)
    })

    const avgCV = calcAvg(cvVals)
    const avgText = svgEl('text', { x: W - padR, y: 10, 'text-anchor': 'end', class: 'axis-text' })
    avgText.textContent = 'avg ' + avgCV!.toFixed(1) + '%'
    svg.appendChild(avgText)
  }, [days, allDays, selectedDayIndex, onDaySelect, show])

  // Recovery Balance
  useEffect(() => {
    const svg = balanceSvgRef.current
    if (!svg) return
    svg.innerHTML = ''

    const W = 420, H = 120
    const padL = 30, padR = 8, padT = 10, padB = 20
    const chartW = W - padL - padR
    const chartH = H - padT - padB
    makeResponsive(svg, W, H)

    const maxLoad = Math.max(50, ...days.map((d) => d.readiness_training_load || 0)) * 1.1
    const barW = (chartW / days.length) * 0.7
    const gap = (chartW / days.length) * 0.3

    // Y axis
    ;[0, 25, 50, 75].forEach((v) => {
      if (v > maxLoad) return
      const y = padT + chartH - (v / maxLoad) * chartH
      svg.appendChild(svgEl('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: 'var(--border-soft)', 'stroke-width': 0.5 }))
      const t = svgEl('text', { x: padL - 4, y: y + 3, 'text-anchor': 'end', class: 'axis-text' })
      t.textContent = String(v)
      svg.appendChild(t)
    })

    // Training load bars + readiness dots
    days.forEach((d, i) => {
      const x = padL + i * (barW + gap) + gap / 2
      const load = d.readiness_training_load || 0
      const barH = (load / maxLoad) * chartH
      svg.appendChild(svgEl('rect', { x, y: padT + chartH - barH, width: barW, height: barH, fill: 'var(--accent)', rx: 1, opacity: 0.3 }))

      if (d.readiness !== null && d.readiness !== undefined) {
        const ry = padT + chartH - (d.readiness / 100) * chartH
        svg.appendChild(svgEl('circle', { cx: x + barW / 2, cy: ry, r: 2, fill: 'var(--fg)' }))
      }

      if (i % Math.ceil(days.length / 6) === 0 || i === days.length - 1) {
        const t = svgEl('text', { x: x + barW / 2, y: H - 5, 'text-anchor': 'middle', class: 'axis-text' })
        t.textContent = d.short_date
        svg.appendChild(t)
      }

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
        const loadVal = d.readiness_training_load !== null ? Math.round(d.readiness_training_load) : '—'
        const readVal = d.readiness !== null ? `${Math.round(d.readiness)}/100` : '—'
        let statusStr = 'Balanced'
        if (d.readiness_training_load !== null && d.readiness_training_load > 200 && d.readiness !== null && d.readiness < 60) statusStr = 'Overreaching (Reduce Load)'
        else if (d.readiness_training_load !== null && d.readiness_training_load < 100 && d.readiness !== null && d.readiness >= 75) statusStr = 'Primed (Ready to Train)'
        const rows: TooltipRow[] = [
          { label: 'Readiness', value: readVal },
          { label: 'Training Load', value: String(loadVal) },
          { label: 'Balance State', value: statusStr },
        ]
        show(e.clientX, e.clientY, d.date, rows)
      })
      svg.appendChild(hitArea)
    })

    // Connect readiness dots
    let rPath = ''
    days.forEach((d, i) => {
      if (d.readiness === null || d.readiness === undefined) return
      const x = padL + i * (barW + gap) + gap / 2 + barW / 2
      const y = padT + chartH - (d.readiness / 100) * chartH
      rPath += (rPath ? 'L' : 'M') + x + ',' + y
    })
    if (rPath) {
      svg.appendChild(svgEl('path', { d: rPath, fill: 'none', stroke: 'var(--fg)', 'stroke-width': 1.5, opacity: 0.6 }))
    }
  }, [days, allDays, selectedDayIndex, onDaySelect, show])

  useEffect(() => {
    hide()
  }, [selectedDayIndex, hide])

  const hrvAvg = calcAvg(days.map((d) => d.hrv))
  const rhrAvg = calcAvg(days.map((d) => d.rhr))

  return (
    <div className="chart-group">
      <div className="chart-header">
        <div className="chart-title">❤️ Recovery</div>
        <div className="chart-meta">
          HRV avg {hrvAvg ? hrvAvg.toFixed(1) : '—'}ms · RHR avg {rhrAvg ? rhrAvg.toFixed(0) : '—'}bpm
        </div>
      </div>
      <div className="recovery-chart-wrap">
        <svg className="chart-svg" ref={dualSvgRef} />
        <div className="recovery-tooltip">
          <ul>
            <li><strong style={{ color: 'var(--sleep-rem)' }}>HRV</strong> — Heart Rate Variability: how much your heart beat intervals vary. Higher = better recovery.</li>
            <li><strong style={{ color: 'var(--warn)' }}>RHR</strong> — Resting Heart Rate: baseline cardiac load. Lower = better rested.</li>
            <li><strong style={{ color: 'var(--accent)' }}>HRV-CV</strong> — Coefficient of Variation: stability of HRV over 7 days. Lower = more consistent.</li>
          </ul>
        </div>
        <svg className="chart-svg" ref={cvSvgRef} style={{ marginTop: 'var(--space-4)' }} />
        <div className="recovery-balance-card">
          <div className="recovery-balance-title">Recovery Balance</div>
          <svg className="chart-svg" ref={balanceSvgRef} />
        </div>
      </div>
    </div>
  )
}
