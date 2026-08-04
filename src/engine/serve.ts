import type { PlayerId, ServeSide, Team } from './types'

/**
 * Builds the default serve order by interleaving the two teams so that
 * consecutive servers are always on opposite teams (Section 4). Doubles:
 * [team1[0], team2[0], team1[1], team2[1]]. Singles: [team1[0], team2[0]].
 */
export function buildServeOrder(team1: Team, team2: Team): PlayerId[] {
  const order: PlayerId[] = []
  const size = Math.max(team1.length, team2.length)
  for (let i = 0; i < size; i++) {
    if (team1[i] !== undefined) order.push(team1[i])
    if (team2[i] !== undefined) order.push(team2[i])
  }
  return order
}

/**
 * Who serves a given game (0-based index: game 1 -> index 0 -> serveOrder[0]).
 * The same rotation is reused, offset, to find tiebreak servers (see
 * tiebreakServerRotationOffset below).
 */
export function nextServer(serveOrder: PlayerId[], gameIndex: number): PlayerId {
  if (serveOrder.length === 0) throw new Error('serveOrder must not be empty')
  const index = ((gameIndex % serveOrder.length) + serveOrder.length) % serveOrder.length
  return serveOrder[index]
}

/**
 * Side to serve from, given how many points have been completed in the
 * current game or tiebreak. Point 1 (0 completed) is always Direita, then it
 * alternates every point. Identical rule for regular games and tiebreaks.
 */
export function serveSide(pointsCompleted: number): ServeSide {
  return pointsCompleted % 2 === 0 ? 'Direita' : 'Esquerda'
}

/**
 * How many rotation steps into serveOrder the tiebreak server is, for a given
 * 1-based point number within the tiebreak: point 1 serves alone, then each
 * following server serves 2 points (1, 2, 2, 2, ...).
 */
export function tiebreakServerRotationOffset(pointNumber1Based: number): number {
  if (pointNumber1Based < 1) throw new Error('pointNumber1Based must be >= 1')
  if (pointNumber1Based === 1) return 0
  return 1 + Math.floor((pointNumber1Based - 2) / 2)
}

/**
 * Server for a given point of the tiebreak, continuing the same rotation the
 * match has used all along (gamesCompletedBeforeTiebreak = games1 + games2
 * when the tiebreak started).
 */
export function tiebreakServer(
  serveOrder: PlayerId[],
  gamesCompletedBeforeTiebreak: number,
  pointNumber1Based: number,
): PlayerId {
  const offset = tiebreakServerRotationOffset(pointNumber1Based)
  return nextServer(serveOrder, gamesCompletedBeforeTiebreak + offset)
}

interface ChangeEndsState {
  isTiebreak: boolean
  totalGamesCompleted: number
  tiebreakPointsCompleted: number
}

/**
 * Whether players should change ends right now: after every game where the
 * total games played in the set is odd (1, 3, 5, ...), or every 6 points
 * during a tiebreak.
 */
export function shouldChangeEnds(state: ChangeEndsState): boolean {
  if (state.isTiebreak) {
    return state.tiebreakPointsCompleted > 0 && state.tiebreakPointsCompleted % 6 === 0
  }
  return state.totalGamesCompleted % 2 === 1
}
