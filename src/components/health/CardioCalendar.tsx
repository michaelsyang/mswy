import { useEffect, useRef } from 'react'
import type { Baselines, HealthDay } from '../../lib/types'
import { useTooltip, type TooltipRow } from '../health/TooltipProvider'

interface CardioCalendarProps {
  days: HealthDay[]
  allDays: HealthDay[]
  baselines: Baselines
  selectedDayIndex: number
  onDaySelect: (index: number) => void
}

export default function CardioCalendar({ days, allDays, baselines, selectedDayIndex, onDaySelect }: CardioCalendarProps) {
  const calRef = useRef<HTMLDivElement>(null)
  const { show, hide } = useTooltip()

  useEffect(() => {
    const cal = calRef.current
    if (!cal) return
    cal.innerHTML = ''

    const cardioAvg = baselines.cardio_avg || 21

    // Day-of-week headers
    const dows = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    dows.forEach((dow) => {
      const header = document.createElement('div')
      header.style.cssText = 'text-align:center;font-size:8px;color:var(--muted);padding:2px 0;'
      header.textContent = dow
      cal.appendChild(header)
    })

    // Calculate offset to align first day to correct DOW column
    const firstDay = days[0]
    if (firstDay) {
      const date = new Date(firstDay.date)
      let dow = date.getDay() // 0=Sun
      dow = dow === 0 ? 6 : dow - 1 // Convert to Mon=0
      for (let i = 0; i < dow; i++) {
        const empty = document.createElement('div')
        empty.className = 'cal-day no-data'
        cal.appendChild(empty)
      }
    }

    const today = allDays[allDays.length - 1]
    days.forEach((d) => {
      const cell = document.createElement('div')
      cell.className = 'cal-day'
      const cardio = (d.cardio_min || 0) + (d.fat_burn_min || 0)
      if (cardio > 0) {
        cell.classList.add('has-cardio')
        if (cardio > cardioAvg * 2) cell.classList.add('has-cardio-high')
      }
      if (d.date === today.date) cell.classList.add('today')

      // Exercise icon
      let icon = ''
      if (d.exercises && d.exercises.length > 0) {
        const types = new Set(d.exercises.map((e) => e.type))
        if (types.has('RUNNING')) icon = '🏃'
        else if (types.has('ELLIPTICAL')) icon = '🏋️'
        else icon = '🚶'
      }

      cell.innerHTML = `
        <div class="cal-dow">${d.day_name}</div>
        <div class="cal-dt">${d.short_date}</div>
        ${icon ? `<div class="cal-icon">${icon}</div>` : ''}
      `
      cell.addEventListener('pointerdown', (e: PointerEvent) => {
        const idx = allDays.indexOf(d)
        if (idx >= 0) onDaySelect(idx)
        const rows: TooltipRow[] = [
          { label: 'Cardio Zone', value: `${d.cardio_min || 0} min` },
          { label: 'Fat Burn', value: `${d.fat_burn_min || 0} min` },
          { label: 'Total Active', value: `${cardio} min` },
          { label: 'Workouts', value: String(d.exercise_count || 0) },
        ]
        show(e.clientX, e.clientY, d.date, rows)
      })
      cal.appendChild(cell)
    })
  }, [days, allDays, baselines, selectedDayIndex, onDaySelect, show])

  useEffect(() => {
    hide()
  }, [selectedDayIndex, hide])

  const totalCardio = days.reduce((sum, d) => sum + (d.cardio_min || 0) + (d.fat_burn_min || 0), 0)
  const activeDays = days.filter((d) => (d.cardio_min || 0) + (d.fat_burn_min || 0) > 0).length

  return (
    <div className="chart-group">
      <div className="chart-header">
        <div className="chart-title">🔥 Cardio</div>
        <div className="chart-meta">{activeDays} active days · {totalCardio} min total</div>
      </div>
      <div className="cardio-cal" ref={calRef} />
    </div>
  )
}
