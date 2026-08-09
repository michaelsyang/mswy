import { useQuery } from '@tanstack/react-query'
import type { HealthData } from '../lib/types'

const DATA_URLS = [
  '/data.json',
  'data.json',
  './data.json',
]

async function fetchHealthData(): Promise<HealthData> {
  for (const url of DATA_URLS) {
    try {
      const resp = await fetch(url)
      if (!resp.ok) continue
      return (await resp.json()) as HealthData
    } catch {
      continue
    }
  }
  throw new Error('Failed to load health data from all URLs')
}

export function useHealthData() {
  return useQuery({
    queryKey: ['health-data'],
    queryFn: fetchHealthData,
    staleTime: 5 * 60 * 1000,
  })
}
