import { useEffect, useRef } from 'react'
import type { HealthDay } from '../../lib/types'

interface DayBarProps {
  days: HealthDay[]
  selectedDayIndex: number
  onDaySelect: (index: number) => void
}

export default function DayBar({ days, selectedDayIndex, onDaySelect }: DayBarProps) {
  const barRef = useRef<HTMLDivElement>(null)

  // Always show last 14 days
  const visibleDays = days.slice(-14)

  // Scroll to active day
  useEffect(() => {
    if (barRef.current) {
      const activeCell = barRef.current.querySelector('.day-cell.active') as HTMLElement
      if (activeCell) {
        activeCell.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      } else {
        barRef.current.scrollLeft = barRef.current.scrollWidth
      }
    }
  }, [selectedDayIndex, days])

  return (
    <div className="day-bar" ref={barRef}>
      {visibleDays.map((d, i) => {
        const realIndex = days.length - 14 + i
        const hasData = d.readiness !== null && d.readiness !== undefined
        return (
          <button
            key={d.date}
            className={`day-cell ${realIndex === selectedDayIndex ? 'active' : ''}`}
            onClick={() => onDaySelect(realIndex)}
          >
            <div className="dow">{d.day_name}</div>
            <div className="dt">{d.short_date}</div>
            <div className={`dot ${hasData ? 'has-data' : ''}`} />
          </button>
        )
      })}
    </div>
  )
}
