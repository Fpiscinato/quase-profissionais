import { shouldChangeEnds } from '../../engine/serve'
import type { MatchState } from '../../engine/types'

export type LiveAlert = 'tiebreak' | 'game' | 'change-ends' | 'set-over'

export const ALERT_LABELS: Record<LiveAlert, string> = {
  'set-over': 'Set encerrado',
  tiebreak: 'Tiebreak!',
  game: 'Game!',
  'change-ends': 'Troquem de lado',
}

/**
 * Alerts are derived purely from the current MatchState (Section 5), and are
 * only true at the exact boundary moment (start of the next game/tiebreak
 * segment) — they self-clear as soon as the next point is played.
 */
export function computeAlerts(state: MatchState): LiveAlert[] {
  if (state.isMatchOver) return ['set-over']

  const alerts: LiveAlert[] = []
  const gamePointsPlayed = state.currentGame.points1 + state.currentGame.points2
  const tiebreakPointsPlayed = state.tiebreak.points1 + state.tiebreak.points2

  if (state.isTiebreak && tiebreakPointsPlayed === 0) {
    alerts.push('tiebreak')
  } else if (!state.isTiebreak && gamePointsPlayed === 0 && state.totalGamesCompleted > 0) {
    alerts.push('game')
  }

  const changeEnds = shouldChangeEnds({
    isTiebreak: state.isTiebreak,
    totalGamesCompleted: state.totalGamesCompleted,
    tiebreakPointsCompleted: tiebreakPointsPlayed,
  })
  // For a normal game, shouldChangeEnds stays true for the whole next game —
  // gate it to the boundary moment. In a tiebreak it's already only true on
  // exact multiples of 6, so no extra gating is needed there.
  if (changeEnds && (state.isTiebreak || gamePointsPlayed === 0)) {
    alerts.push('change-ends')
  }

  return alerts
}
