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

/**
 * The physical side of the court a team occupies — distinct from
 * ServeSide/serveSide above, which is the service box (Direita/Esquerda)
 * used *within* a game. CourtSide is which end of the court (as seen by a
 * spectator) a team stands on, chosen once at match setup and then flipped
 * by every change of ends.
 */
export type CourtSide = 'Esquerda' | 'Direita'

function flipCourtSide(side: CourtSide): CourtSide {
  return side === 'Direita' ? 'Esquerda' : 'Direita'
}

/**
 * How many change-of-ends events have happened so far in the set: one after
 * every odd total-games-completed boundary (1, 3, 5, ...), plus one every 6
 * points once a tiebreak is underway. totalGamesCompleted stays constant for
 * the whole tiebreak (games1/games2 don't change until it's decided), so the
 * two counts are simply additive.
 */
export function changeEndsCount(state: ChangeEndsState): number {
  const gameSwaps = Math.ceil(state.totalGamesCompleted / 2)
  const tiebreakSwaps = state.isTiebreak ? Math.floor(state.tiebreakPointsCompleted / 6) : 0
  return gameSwaps + tiebreakSwaps
}

/** Team 1's current physical side, given the side it started the set on. */
export function currentCourtSide(team1InitialSide: CourtSide, swaps: number): CourtSide {
  return swaps % 2 === 0 ? team1InitialSide : flipCourtSide(team1InitialSide)
}

/**
 * Team 1's full side history, one entry per segment played so far (the
 * current segment is last) — e.g. ['Direita', 'Esquerda', 'Direita'] after 2
 * changes of ends. Team 2's side at any index is always the opposite.
 */
export function courtSideHistory(team1InitialSide: CourtSide, swaps: number): CourtSide[] {
  const history: CourtSide[] = []
  let side = team1InitialSide
  for (let i = 0; i <= swaps; i++) {
    history.push(side)
    side = flipCourtSide(side)
  }
  return history
}
