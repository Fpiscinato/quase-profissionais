export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

/** Human-friendly duration for stats totals ("2h 15min", "45min", "0min") — not mm:ss like the live timer. */
export function formatHoursMinutes(totalSeconds: number): string {
  const minutesTotal = Math.round(Math.max(0, totalSeconds) / 60)
  const h = Math.floor(minutesTotal / 60)
  const m = minutesTotal % 60
  if (h === 0) return `${m}min`
  return `${h}h ${m}min`
}
