import { useQuery } from '@tanstack/react-query'
import type { HealthData } from '../lib/types'

const DATA_URL = '/data.json'

async function fetchHealthData(): Promise<HealthData> {
  const resp = await fetch(DATA_URL)
  if (!resp.ok) {
    throw new Error(`Failed to load health data: ${resp.status} ${resp.statusText}`)
  }
  return (await resp.json()) as HealthData
}

export function useHealthData() {
  return useQuery({
    queryKey: ['health-data'],
    queryFn: fetchHealthData,
    staleTime: 5 * 60 * 1000,
  })
}
