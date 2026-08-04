import type { DeuceMode } from '../../engine/types'

/** Tennis point labels (Section 3): 0, 15, 30, 40, then deuce/advantage. */
export function pointLabel(mine: number, theirs: number, deuceMode: DeuceMode): string {
  const LABELS = ['0', '15', '30', '40']
  if (mine < 3 || theirs < 3) return LABELS[Math.min(mine, 3)]
  // Both sides have reached deuce territory (40-40 or later).
  if (mine === theirs) return '40'
  if (mine > theirs) return deuceMode === 'goldenPoint' ? '40' : 'AD'
  return '40'
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
