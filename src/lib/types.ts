export interface Exercise {
  type: string
}

export interface StageSummary {
  awake?: number
  light?: number
  deep?: number
  rem?: number
}

export interface HealthDay {
  date: string
  day_name: string
  short_date: string
  readiness: number | null
  readiness_hrv_delta: number | null
  readiness_rhr_delta: number | null
  readiness_sleep_eff: number | null
  readiness_training_load: number | null
  sleep_hours: number | null
  sleep_efficiency: number | null
  sleep_deep_min: number | null
  sleep_rem_min: number | null
  sleep_light_min: number | null
  sleep_awake_min: number | null
  sleep_start_pt: string | null
  sleep_end_pt: string | null
  sleep_start_utc: string | null
  sleep_end_utc: string | null
  sleep_duration_min: number | null
  stage_summary: StageSummary
  hrv: number | null
  rhr: number | null
  spo2_avg: number | null
  spo2_min: number | null
  spo2_max: number | null
  steps: number | null
  active_kcal: number | null
  cardio_min: number
  fat_burn_min: number
  distance_km: number | null
  floors: number | null
  exercises: Exercise[]
  exercise_count: number
  hrv_cv: number | null
  hrv_range_low: number | null
  hrv_range_high: number | null
  data_quality?: string | null
}

export interface Baselines {
  hrv_avg: number
  hrv_min: number
  hrv_max: number
  rhr_avg: number
  rhr_min: number
  rhr_max: number
  sleep_avg: number
  readiness_avg: number
  readiness_min: number
  readiness_max: number
  steps_avg: number
  cardio_avg: number
}

export interface Anomaly {
  id: number
  date: string
  metric: string
  value: number
  baseline: number | null
  deviation_pct: number
  severity: 'warning' | 'critical'
  acknowledged: number
  detected_at: string
}

export interface HealthData {
  generated_at: string
  days: HealthDay[]
  baselines: Baselines
  anomalies: Anomaly[]
}
