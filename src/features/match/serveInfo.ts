import { nextServer, serveSide, tiebreakServer } from '../../engine/serve'
import type { MatchState, PlayerId, ServeSide } from '../../engine/types'

export interface ServeInfo {
  serverId: PlayerId
  side: ServeSide
}

/** Who serves next and from which side, derived entirely from MatchState (Section 4). Null once the match is over. */
export function computeServeInfo(state: MatchState, serveOrder: PlayerId[]): ServeInfo | null {
  if (state.isMatchOver) return null

  if (state.isTiebreak) {
    // Cumulative across the whole match (not just the current set) — serve
    // rotation continues seamlessly across set boundaries, per the official
    // rules (see MatchState.totalGamesCompleted).
    const gamesCompletedBeforeTiebreak = state.totalGamesCompleted
    const pointNumber = state.tiebreak.points1 + state.tiebreak.points2 + 1
    return {
      serverId: tiebreakServer(serveOrder, gamesCompletedBeforeTiebreak, pointNumber),
      side: serveSide(state.tiebreak.points1 + state.tiebreak.points2),
    }
  }

  const gameIndex = state.totalGamesCompleted
  return {
    serverId: nextServer(serveOrder, gameIndex),
    side: serveSide(state.currentGame.points1 + state.currentGame.points2),
  }
}
