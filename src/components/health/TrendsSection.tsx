import type { Anomaly, Baselines, HealthDay } from '../../lib/types'
import Observations from './Observations'
import SleepChart from './SleepChart'
import StepsChart from './StepsChart'
import CardioCalendar from './CardioCalendar'
import RecoveryChart from './RecoveryChart'
import Spo2Chart from './Spo2Chart'

interface TrendsSectionProps {
  days: HealthDay[]
  allDays: HealthDay[]
  baselines: Baselines
  anomalies: Anomaly[]
  currentRange: number
  onRangeChange: (range: number) => void
  selectedDayIndex: number
  onDaySelect: (index: number) => void
}

const RANGES = [7, 14, 30]

export default function TrendsSection({
  days,
  allDays,
  baselines,
  anomalies,
  currentRange,
  onRangeChange,
  selectedDayIndex,
  onDaySelect,
}: TrendsSectionProps) {
  return (
    <section className="trends-section">
      <div className="trends-header">
        <div className="trends-title">Trends</div>
        <div className="range-toggle">
          {RANGES.map((r) => (
            <button
              key={r}
              className={`range-btn ${currentRange === r ? 'active' : ''}`}
              onClick={() => onRangeChange(r)}
            >
              {r}D
            </button>
          ))}
        </div>
      </div>

      <Observations anomalies={anomalies} allDays={allDays} />

      <SleepChart
        days={days}
        allDays={allDays}
        currentRange={currentRange}
        selectedDayIndex={selectedDayIndex}
        onDaySelect={onDaySelect}
      />

      <StepsChart
        days={days}
        allDays={allDays}
        selectedDayIndex={selectedDayIndex}
        onDaySelect={onDaySelect}
      />

      <CardioCalendar
        days={days}
        allDays={allDays}
        baselines={baselines}
        selectedDayIndex={selectedDayIndex}
        onDaySelect={onDaySelect}
      />

      <RecoveryChart
        days={days}
        allDays={allDays}
        selectedDayIndex={selectedDayIndex}
        onDaySelect={onDaySelect}
      />

      <Spo2Chart
        days={days}
        allDays={allDays}
        selectedDayIndex={selectedDayIndex}
        onDaySelect={onDaySelect}
      />
    </section>
  )
}
