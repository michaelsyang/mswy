import { useEffect, useRef } from 'react'
import type { HealthDay } from '../../lib/types'
import DayBar from './DayBar'

interface HealthHeaderProps {
  generatedAt: string
  days: HealthDay[]
  selectedDayIndex: number
  onDaySelect: (index: number) => void
}

export default function HealthHeader({ generatedAt, days, selectedDayIndex, onDaySelect }: HealthHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null)

  // Format last sync time in PT
  const genAt = new Date(generatedAt)
  const ptTime = genAt.toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
  })

  // Scroll: collapse day bar when scrolled past
  useEffect(() => {
    const onScroll = () => {
      if (headerRef.current) {
        if (window.scrollY > 60) {
          headerRef.current.classList.add('scrolled')
        } else {
          headerRef.current.classList.remove('scrolled')
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="top-header" ref={headerRef}>
      <div className="header-row">
        <div className="header-title">Health</div>
        <div className="header-sync">Last sync: {ptTime} PT</div>
      </div>
      <DayBar days={days} selectedDayIndex={selectedDayIndex} onDaySelect={onDaySelect} />
    </div>
  )
}
