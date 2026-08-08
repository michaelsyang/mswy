import type { HealthDay } from '../lib/types'

/** Last valid day with readiness data */
export function getLastValidDay(days: HealthDay[]): { day: HealthDay; index: number } | null {
  if (!days || days.length === 0) return null
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].readiness !== null && days[i].readiness !== undefined) {
      return { day: days[i], index: i }
    }
  }
  return { day: days[days.length - 1], index: days.length - 1 }
}

/** Get the last N days */
export function getDays(days: HealthDay[], range: number): HealthDay[] {
  if (!days) return []
  return days.slice(-range)
}

/** Find day index by date string */
export function findDayByDate(days: HealthDay[], date: string): HealthDay | undefined {
  return days.find((d) => d.date === date)
}

/** SVG element creator for imperative SVG generation */
export function svgEl(
  name: string,
  attrs: Record<string, string | number>,
): SVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name)
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v))
  }
  return el
}

/** Set responsive viewBox on an SVG element */
export function makeResponsive(svg: SVGSVGElement, w: number, h: number): void {
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
}
