import { useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import type { HealthDay } from '../../lib/types'
import DayBar from './DayBar'
import { useTimezone } from '../../context/TimezoneContext'
import { tzLabel, utcToWallClock } from '../../lib/timezones'
import type { TzPref } from '../../lib/timezones'

interface HealthHeaderProps {
  generatedAt: string
  days: HealthDay[]
  selectedDayIndex: number
  onDaySelect: (index: number) => void
}

export default function HealthHeader({ generatedAt, days, selectedDayIndex, onDaySelect }: HealthHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const { pref, tz, setPref } = useTimezone()

  // Last sync time in the selected timezone
  const syncTime = utcToWallClock(generatedAt, tz)

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

  const onTzChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPref(e.target.value as TzPref)
  }

  // Auto label shows what the device resolved to, e.g. "Auto · KST"
  const autoLabel = `Auto · ${tzLabel(tz)}`

  return (
    <div className="top-header" ref={headerRef}>
      <div className="header-row">
        <div className="header-title">Health</div>
        <div className="header-right">
          <div className="header-sync">
            {syncTime ? `Last sync: ${syncTime} ${tzLabel(tz)}` : 'Last sync: …'}{' '}
          </div>
          <select
            className="tz-select"
            value={pref}
            onChange={onTzChange}
            aria-label="Display timezone"
            title="Display times in this timezone"
          >
            <option value="auto">{autoLabel}</option>
            <option value="America/Los_Angeles">PT</option>
            <option value="Asia/Seoul">KST</option>
          </select>
        </div>
      </div>
      <DayBar days={days} selectedDayIndex={selectedDayIndex} onDaySelect={onDaySelect} />
    </div>
  )
}
