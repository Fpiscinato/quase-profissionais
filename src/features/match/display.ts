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
