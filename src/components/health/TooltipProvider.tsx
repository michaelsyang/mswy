import {
  createContext,
  useContext,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'

export interface TooltipRow {
  label: string
  value: string
}

interface TooltipContextValue {
  show: (x: number, y: number, date: string, rows: TooltipRow[]) => void
  hide: () => void
}

const TooltipContext = createContext<TooltipContextValue | null>(null)

export function useTooltip() {
  const ctx = useContext(TooltipContext)
  if (!ctx) throw new Error('useTooltip must be used within TooltipProvider')
  return ctx
}

function fmtDate(d: string): string {
  const parts = d.split('-')
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`
}

function dayName(d: string): string {
  const parts = d.split('-')
  const dt = new Date(
    parseInt(parts[0]),
    parseInt(parts[1]) - 1,
    parseInt(parts[2]),
  )
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()]
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const show = useCallback(
    (x: number, y: number, date: string, rows: TooltipRow[]) => {
      const el = overlayRef.current
      if (!el) return

      let html = `<div class="tt-date">${dayName(date)} ${fmtDate(date)}</div>`
      rows.forEach((r) => {
        html += `<div class="tt-row"><span class="tt-label">${r.label}</span><span class="tt-val">${r.value}</span></div>`
      })
      el.innerHTML = html
      el.classList.add('visible')

      const rect = el.getBoundingClientRect()
      let tx = x + 12
      let ty = y - rect.height / 2

      if (tx + rect.width > window.innerWidth - 8) {
        tx = x - rect.width - 12
      }
      if (ty < 8) ty = 8
      if (ty + rect.height > window.innerHeight - 8) {
        ty = window.innerHeight - rect.height - 8
      }

      el.style.left = `${tx}px`
      el.style.top = `${ty}px`
    },
    [],
  )

  const hide = useCallback(() => {
    const el = overlayRef.current
    if (el) {
      el.classList.remove('visible')
      el.innerHTML = ''
    }
  }, [])

  return (
    <TooltipContext.Provider value={{ show, hide }}>
      {children}
      <div ref={overlayRef} className="tooltip-overlay" />
    </TooltipContext.Provider>
  )
}
