import { useState, useMemo } from 'react'
import { useHealthData } from '../hooks/useHealthData'
import { getLastValidDay, getDays } from '../lib/svg-utils'
import type { HealthDay } from '../lib/types'
import HealthHeader from '../components/health/HealthHeader'
import TodaySection from '../components/health/TodaySection'
import TrendsSection from '../components/health/TrendsSection'
import { TooltipProvider } from '../components/health/TooltipProvider'
import ErrorState from '../components/ui/ErrorState'
import LoadingState from '../components/ui/LoadingState'
import './health-dashboard.css'

export default function HealthDashboard() {
  const { data: RAW, isLoading, error } = useHealthData()
  const [currentRange, setCurrentRange] = useState(14)
  const [selectedDayIndex, setSelectedDayIndex] = useState(-1)

  const lastValid = useMemo(() => {
    if (!RAW) return null
    return getLastValidDay(RAW.days)
  }, [RAW])

  const displayDayIndex = selectedDayIndex >= 0 ? selectedDayIndex : lastValid?.index ?? 0
  const displayDay: HealthDay | null = RAW ? RAW.days[displayDayIndex] ?? null : null

  const days = useMemo(() => {
    if (!RAW) return []
    return getDays(RAW.days, currentRange)
  }, [RAW, currentRange])

  if (isLoading) return <LoadingState />
  if (error || !RAW) return <ErrorState message="Failed to load health data. Try refreshing." />

  const handleDaySelect = (index: number) => {
    setSelectedDayIndex(index)
  }

  return (
    <TooltipProvider>
      <div className="health-dashboard">
        <HealthHeader
          generatedAt={RAW.generated_at}
          days={RAW.days}
          selectedDayIndex={displayDayIndex}
          onDaySelect={handleDaySelect}
        />
        <TodaySection day={displayDay} baselines={RAW.baselines} displayIndex={displayDayIndex} allDays={RAW.days} />
        <div className="section-divider" />
        <TrendsSection
          days={days}
          allDays={RAW.days}
          baselines={RAW.baselines}
          anomalies={RAW.anomalies}
          currentRange={currentRange}
          onRangeChange={setCurrentRange}
          selectedDayIndex={selectedDayIndex}
          onDaySelect={handleDaySelect}
        />
      </div>
    </TooltipProvider>
  )
}
