import type { MatchResult, PlayerId, PlayerStanding, TeamStanding } from './types'

function emptyStanding(playerId: PlayerId): PlayerStanding {
  return {
    playerId,
    matchesPlayed: 0,
    matchesWon: 0,
    gamesWon: 0,
    gamesLost: 0,
    pointsWon: 0,
    pointsLost: 0,
    setsWon: 0,
    setsLost: 0,
    winRate: 0,
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
    setsWon: number,
    setsLost: number,
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
      entry.setsWon += setsWon
      entry.setsLost += setsLost
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
      match.sets1,
      match.sets2,
      match.winnerTeam === 'team1',
    )
    credit(
      match.team2,
      match.games2,
      match.games1,
      match.points2,
      match.points1,
      match.sets2,
      match.sets1,
      match.winnerTeam === 'team2',
    )
  }

  for (const s of standings.values()) {
    s.winRate = s.matchesPlayed > 0 ? Math.round((s.matchesWon / s.matchesPlayed) * 100) : 0
  }

  return Array.from(standings.values()).sort((a, b) => {
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon
    if (b.pointsWon !== a.pointsWon) return b.pointsWon - a.pointsWon
    return b.matchesWon - a.matchesWon
  })
}

function teamKey(playerIds: PlayerId[]): string {
  return [...playerIds].sort().join('|')
}

function emptyTeamStanding(playerIds: PlayerId[]): TeamStanding {
  return {
    playerIds: [...playerIds].sort(),
    matchesPlayed: 0,
    matchesWon: 0,
    gamesWon: 0,
    gamesLost: 0,
    pointsWon: 0,
    pointsLost: 0,
    setsWon: 0,
    setsLost: 0,
    winRate: 0,
  }
}

/**
 * Ranking by exact pairing (Team/Dupla): the same two players only share a
 * row if they played together as a team, unlike computeStandings which
 * credits each player individually. In singles matches team size is 1, so
 * this naturally reduces to the same numbers as computeStandings for those.
 * Same sort order: Games Won, then Points Won, then Matches Won.
 */
export function computeTeamStandings(matches: MatchResult[]): TeamStanding[] {
  const standings = new Map<string, TeamStanding>()

  const credit = (
    playerIds: PlayerId[],
    gamesWon: number,
    gamesLost: number,
    pointsWon: number,
    pointsLost: number,
    setsWon: number,
    setsLost: number,
    won: boolean,
  ) => {
    const key = teamKey(playerIds)
    const entry = standings.get(key) ?? emptyTeamStanding(playerIds)
    entry.matchesPlayed += 1
    if (won) entry.matchesWon += 1
    entry.gamesWon += gamesWon
    entry.gamesLost += gamesLost
    entry.pointsWon += pointsWon
    entry.pointsLost += pointsLost
    entry.setsWon += setsWon
    entry.setsLost += setsLost
    standings.set(key, entry)
  }

  for (const match of matches) {
    credit(
      match.team1,
      match.games1,
      match.games2,
      match.points1,
      match.points2,
      match.sets1,
      match.sets2,
      match.winnerTeam === 'team1',
    )
    credit(
      match.team2,
      match.games2,
      match.games1,
      match.points2,
      match.points1,
      match.sets2,
      match.sets1,
      match.winnerTeam === 'team2',
    )
  }

  for (const s of standings.values()) {
    s.winRate = s.matchesPlayed > 0 ? Math.round((s.matchesWon / s.matchesPlayed) * 100) : 0
  }

  return Array.from(standings.values()).sort((a, b) => {
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon
    if (b.pointsWon !== a.pointsWon) return b.pointsWon - a.pointsWon
    return b.matchesWon - a.matchesWon
  })
}

/**
 * Generic streak calculator: for every distinct key (player id or team key),
 * builds a W/L timeline from a chronologically-sorted match list and counts
 * how many results at the end are the same (the "current streak").
 */
function computeStreaks<T>(
  matches: MatchResult[],
  entriesOf: (match: MatchResult) => Array<{ key: T; result: 'W' | 'L' }>,
): Map<T, { type: 'W' | 'L'; count: number }> {
  const timeline = new Map<T, ('W' | 'L')[]>()

  for (const match of matches) {
    if (!match.winnerTeam) continue
    for (const { key, result } of entriesOf(match)) {
      const arr = timeline.get(key) ?? []
      arr.push(result)
      timeline.set(key, arr)
    }
  }

  const result = new Map<T, { type: 'W' | 'L'; count: number }>()
  for (const [key, results] of timeline) {
    if (results.length === 0) continue
    const last = results[results.length - 1]
    let count = 0
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i] !== last) break
      count++
    }
    result.set(key, { type: last, count })
  }

  return result
}

/**
 * Computes the current win/loss streak for each player from a
 * chronologically-sorted list of completed matches (oldest first).
 * A streak counts from the most recent match backwards: the first
 * consecutive wins (or losses) from the end form the streak.
 */
export function computeCurrentStreaks(
  matches: MatchResult[],
): Map<PlayerId, { type: 'W' | 'L'; count: number }> {
  return computeStreaks(matches, (m) => {
    const entries: Array<{ key: PlayerId; result: 'W' | 'L' }> = []
    const sideResult: Record<'team1' | 'team2', 'W' | 'L'> = {
      team1: m.winnerTeam === 'team1' ? 'W' : 'L',
      team2: m.winnerTeam === 'team2' ? 'W' : 'L',
    }
    for (const pid of m.team1) entries.push({ key: pid, result: sideResult.team1 })
    for (const pid of m.team2) entries.push({ key: pid, result: sideResult.team2 })
    return entries
  })
}

/**
 * Current streak per exact pairing (same team key as computeTeamStandings):
 * the same two players only share a row when they played together as a team.
 */
export function computeTeamStreaks(
  matches: MatchResult[],
): Map<string, { type: 'W' | 'L'; count: number }> {
  return computeStreaks(matches, (m) => {
    const key = teamKey(m.team1)
    return [
      {
        key,
        result: m.winnerTeam === 'team1' ? 'W' : 'L',
      },
      {
        key: teamKey(m.team2),
        result: m.winnerTeam === 'team2' ? 'W' : 'L',
      },
    ]
  })
}

export interface HeadToHeadMatch {
  team1: PlayerId[]
  team2: PlayerId[]
  games1: number
  games2: number
  winnerTeam: 'team1' | 'team2'
  winnerPlayer: PlayerId
}

export interface HeadToHeadResult {
  player1Id: PlayerId
  player2Id: PlayerId
  player1Wins: number
  player2Wins: number
  totalMatches: number
  matches: HeadToHeadMatch[]
}

/**
 * Head-to-head record between two players: how many times each won when
 * they faced each other on opposite sides. Same-side matches are ignored.
 */
export function computeHeadToHead(
  player1Id: PlayerId,
  player2Id: PlayerId,
  matches: MatchResult[],
): HeadToHeadResult {
  const result: HeadToHeadResult = {
    player1Id,
    player2Id,
    player1Wins: 0,
    player2Wins: 0,
    totalMatches: 0,
    matches: [],
  }

  for (const match of matches) {
    const p1Side = match.team1.includes(player1Id)
      ? 'team1'
      : match.team2.includes(player1Id)
        ? 'team2'
        : null
    const p2Side = match.team1.includes(player2Id)
      ? 'team1'
      : match.team2.includes(player2Id)
        ? 'team2'
        : null

    if (!p1Side || !p2Side || p1Side === p2Side) continue

    const p1Won = match.winnerTeam === p1Side

    result.totalMatches++
    if (p1Won) result.player1Wins++
    else result.player2Wins++

    result.matches.push({
      team1: match.team1,
      team2: match.team2,
      games1: match.games1,
      games2: match.games2,
      winnerTeam: match.winnerTeam,
      winnerPlayer: p1Won ? player1Id : player2Id,
    })
  }

  return result
}
