import type { MatchResult, PlayerId, PlayerStanding } from './types'

function emptyStanding(playerId: PlayerId): PlayerStanding {
  return {
    playerId,
    matchesPlayed: 0,
    matchesWon: 0,
    gamesWon: 0,
    gamesLost: 0,
    pointsWon: 0,
    pointsLost: 0,
  }
}

/**
 * Individual ranking derived from completed matches (Section 6). Both
 * players on a side are credited that side's games/points (singles credits
 * the one player). Sorted by Games Won, then Points Won, then Matches Won.
 * Position is the resulting array order — not stored on the row.
 */
export function computeStandings(matches: MatchResult[]): PlayerStanding[] {
  const standings = new Map<PlayerId, PlayerStanding>()

  const credit = (
    playerIds: PlayerId[],
    gamesWon: number,
    gamesLost: number,
    pointsWon: number,
    pointsLost: number,
    won: boolean,
  ) => {
    for (const playerId of playerIds) {
      const entry = standings.get(playerId) ?? emptyStanding(playerId)
      entry.matchesPlayed += 1
      if (won) entry.matchesWon += 1
      entry.gamesWon += gamesWon
      entry.gamesLost += gamesLost
      entry.pointsWon += pointsWon
      entry.pointsLost += pointsLost
      standings.set(playerId, entry)
    }
  }

  for (const match of matches) {
    credit(
      match.team1,
      match.games1,
      match.games2,
      match.points1,
      match.points2,
      match.winnerTeam === 'team1',
    )
    credit(
      match.team2,
      match.games2,
      match.games1,
      match.points2,
      match.points1,
      match.winnerTeam === 'team2',
    )
  }

  return Array.from(standings.values()).sort((a, b) => {
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon
    if (b.pointsWon !== a.pointsWon) return b.pointsWon - a.pointsWon
    return b.matchesWon - a.matchesWon
  })
}
