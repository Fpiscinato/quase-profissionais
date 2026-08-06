import { changeEndsCount, courtSideHistory, currentCourtSide } from '../../engine/serve'
import type { CourtSide } from '../../engine/serve'
import type { MatchState } from '../../engine/types'

export interface CourtSides {
  team1: CourtSide
  team2: CourtSide
  /** Team 1's side history, one entry per segment played so far (current segment last). */
  team1History: CourtSide[]
  /** Team 2's side history — always the exact opposite of team1History at every index. */
  team2History: CourtSide[]
}

const opposite = (side: CourtSide): CourtSide => (side === 'Direita' ? 'Esquerda' : 'Direita')

/** Which physical side of the court each team is on right now, derived from MatchState (Section 4/5) and the side Team 1 started the set on. */
export function computeCourtSides(state: MatchState, team1InitialSide: CourtSide): CourtSides {
  const swaps = changeEndsCount({
    isTiebreak: state.isTiebreak,
    totalGamesCompleted: state.totalGamesCompleted,
    tiebreakPointsCompleted: state.tiebreak.points1 + state.tiebreak.points2,
  })
  const team1History = courtSideHistory(team1InitialSide, swaps)
  return {
    team1: currentCourtSide(team1InitialSide, swaps),
    team2: opposite(currentCourtSide(team1InitialSide, swaps)),
    team1History,
    team2History: team1History.map(opposite),
  }
}
