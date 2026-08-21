import { shouldChangeEnds } from '../../engine/serve'
import type { DeuceMode, MatchState } from '../../engine/types'

export type LiveAlert = 'tiebreak' | 'game' | 'change-ends' | 'set-over' | 'golden-point'

export const ALERT_LABELS: Record<LiveAlert, string> = {
  'set-over': 'Set encerrado',
  tiebreak: 'Tiebreak!',
  game: 'Game!',
  'change-ends': 'Troquem de lado',
  'golden-point': 'Ponto de ouro!',
}

/**
 * Alerts are derived purely from the current MatchState (Section 5), and are
 * only true at the exact boundary moment (start of the next game/tiebreak
 * segment) — they self-clear as soon as the next point is played.
 */
export function computeAlerts(state: MatchState, deuceMode: DeuceMode): LiveAlert[] {
  // Once the whole match is over, matchOverCard takes over the screen — no
  // banner needed here. A set ending mid-match (best-of-3/5) gets its own
  // 'set-over' banner below instead, while play continues.
  if (state.isMatchOver) return []

  const alerts: LiveAlert[] = []
  const gamePointsPlayed = state.currentGame.points1 + state.currentGame.points2
  const tiebreakPointsPlayed = state.tiebreak.points1 + state.tiebreak.points2
  // Fresh set boundary: no points played yet in the new set (games or, for a
  // deciding super-tiebreak set, tiebreak points), and at least one set has
  // already been completed — same transient-boundary pattern as 'game'
  // below, self-clears once the first point of the new set lands. Can
  // coincide with 'tiebreak' below (the new set is itself a decider), in
  // which case both banners show together.
  const pointsPlayedInCurrentSet = state.isTiebreak ? tiebreakPointsPlayed : gamePointsPlayed
  const justStartedNewSet =
    state.games1 === 0 && state.games2 === 0 && pointsPlayedInCurrentSet === 0 && state.completedSets.length > 0

  if (justStartedNewSet) {
    alerts.push('set-over')
  }
  if (state.isTiebreak && tiebreakPointsPlayed === 0) {
    alerts.push('tiebreak')
  } else if (!state.isTiebreak && gamePointsPlayed === 0 && state.totalGamesCompleted > 0 && !justStartedNewSet) {
    alerts.push('game')
  }

  // Section 10: the live screen announces when a golden point is being
  // played — at 40-40 (deuce), the very next point decides the game.
  if (
    !state.isTiebreak &&
    deuceMode === 'goldenPoint' &&
    state.currentGame.points1 === state.currentGame.points2 &&
    state.currentGame.points1 >= 3
  ) {
    alerts.push('golden-point')
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
