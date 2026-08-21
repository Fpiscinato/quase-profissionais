import { describe, expect, it } from 'vitest'
import { computeStandings, computeTeamStandings } from './ranking'
import type { MatchResult } from './types'

describe('computeStandings', () => {
  it('credits both partners on a side with that side\'s games and points', () => {
    const matches: MatchResult[] = [
      {
        team1: ['A', 'B'],
        team2: ['C', 'D'],
        games1: 4,
        games2: 2,
        points1: 20,
        points2: 15,
        sets1: 1, sets2: 0, winnerTeam: 'team1',
      },
    ]
    const standings = computeStandings(matches)
    const a = standings.find((s) => s.playerId === 'A')!
    const b = standings.find((s) => s.playerId === 'B')!
    const c = standings.find((s) => s.playerId === 'C')!
    const d = standings.find((s) => s.playerId === 'D')!

    for (const player of [a, b]) {
      expect(player.matchesPlayed).toBe(1)
      expect(player.matchesWon).toBe(1)
      expect(player.gamesWon).toBe(4)
      expect(player.gamesLost).toBe(2)
      expect(player.pointsWon).toBe(20)
      expect(player.pointsLost).toBe(15)
    }
    for (const player of [c, d]) {
      expect(player.matchesPlayed).toBe(1)
      expect(player.matchesWon).toBe(0)
      expect(player.gamesWon).toBe(2)
      expect(player.gamesLost).toBe(4)
      expect(player.pointsWon).toBe(15)
      expect(player.pointsLost).toBe(20)
    }
  })

  it('credits the single player in singles matches', () => {
    const matches: MatchResult[] = [
      {
        team1: ['A'],
        team2: ['B'],
        games1: 4,
        games2: 1,
        points1: 16,
        points2: 8,
        sets1: 1, sets2: 0, winnerTeam: 'team1',
      },
    ]
    const standings = computeStandings(matches)
    expect(standings).toHaveLength(2)
    expect(standings[0].playerId).toBe('A')
  })

  it('orders by Games Won, then Points Won, then Matches Won', () => {
    const matches: MatchResult[] = [
      // A&B beat C&D 4-2, twice, and E&F beat G&H 4-3 once (more matches, fewer games/points).
      { team1: ['A', 'B'], team2: ['C', 'D'], games1: 4, games2: 2, points1: 20, points2: 10, sets1: 1, sets2: 0, winnerTeam: 'team1' },
      { team1: ['A', 'B'], team2: ['C', 'D'], games1: 4, games2: 2, points1: 20, points2: 10, sets1: 1, sets2: 0, winnerTeam: 'team1' },
      { team1: ['E', 'F'], team2: ['G', 'H'], games1: 4, games2: 3, points1: 18, points2: 17, sets1: 1, sets2: 0, winnerTeam: 'team1' },
    ]
    const standings = computeStandings(matches)
    const order = standings.map((s) => s.playerId)
    // A/B: gamesWon=8, pointsWon=40, matchesWon=2 — tops the table.
    expect(order[0]).toMatch(/A|B/)
    expect(order[1]).toMatch(/A|B/)
    // E/F: gamesWon=4, pointsWon=18 — ahead of C/D (gamesWon=4, pointsWon=20)? check tiebreak by points.
    const cd = standings.filter((s) => s.playerId === 'C' || s.playerId === 'D')
    const ef = standings.filter((s) => s.playerId === 'E' || s.playerId === 'F')
    expect(cd[0].gamesWon).toBe(4)
    expect(ef[0].gamesWon).toBe(4)
    // Same games won (4), so Points Won breaks the tie: C/D=20 > E/F=18.
    const cdIndex = standings.findIndex((s) => s.playerId === 'C')
    const efIndex = standings.findIndex((s) => s.playerId === 'E')
    expect(cdIndex).toBeLessThan(efIndex)
  })

  it('breaks a Games Won and Points Won tie using Matches Won', () => {
    const matches: MatchResult[] = [
      // A wins 4-0 once (4 games, 16 pts won, 1 match won).
      { team1: ['A'], team2: ['X'], games1: 4, games2: 0, points1: 16, points2: 4, sets1: 1, sets2: 0, winnerTeam: 'team1' },
      // B loses two matches that add up to the same games/points won but 0 matches won.
      { team1: ['B'], team2: ['Y'], games1: 2, games2: 4, points1: 8, points2: 18, sets1: 0, sets2: 1, winnerTeam: 'team2' },
      { team1: ['B'], team2: ['Z'], games1: 2, games2: 4, points1: 8, points2: 18, sets1: 0, sets2: 1, winnerTeam: 'team2' },
    ]
    const standings = computeStandings(matches)
    const a = standings.find((s) => s.playerId === 'A')!
    const b = standings.find((s) => s.playerId === 'B')!
    expect(a.gamesWon).toBe(b.gamesWon)
    expect(a.pointsWon).toBe(b.pointsWon)
    expect(a.matchesWon).toBeGreaterThan(b.matchesWon)
    expect(standings.indexOf(a)).toBeLessThan(standings.indexOf(b))
  })
})

describe('computeTeamStandings (ranking by exact pairing, "Duplas")', () => {
  it('combines two matches played by the SAME pair into a single row', () => {
    const matches: MatchResult[] = [
      { team1: ['A', 'B'], team2: ['C', 'D'], games1: 4, games2: 2, points1: 20, points2: 15, sets1: 1, sets2: 0, winnerTeam: 'team1' },
      { team1: ['A', 'B'], team2: ['E', 'F'], games1: 4, games2: 1, points1: 16, points2: 8, sets1: 1, sets2: 0, winnerTeam: 'team1' },
    ]
    const standings = computeTeamStandings(matches)
    const ab = standings.find((s) => s.playerIds.includes('A') && s.playerIds.includes('B'))!
    expect(ab.matchesPlayed).toBe(2)
    expect(ab.matchesWon).toBe(2)
    expect(ab.gamesWon).toBe(8)
    expect(ab.gamesLost).toBe(3)
    expect(ab.pointsWon).toBe(36)
    expect(ab.pointsLost).toBe(23)
    // A&B's two matches collapse into one row; {C,D} and {E,F} are separate rows.
    expect(standings).toHaveLength(3)
  })

  it('treats different pairings of the same players as different teams', () => {
    const matches: MatchResult[] = [
      // Round 1: A partners B. Round 2: A partners C instead (rotation).
      { team1: ['A', 'B'], team2: ['C', 'D'], games1: 4, games2: 1, points1: 16, points2: 8, sets1: 1, sets2: 0, winnerTeam: 'team1' },
      { team1: ['A', 'C'], team2: ['B', 'D'], games1: 2, games2: 4, points1: 9, points2: 17, sets1: 0, sets2: 1, winnerTeam: 'team2' },
    ]
    const standings = computeTeamStandings(matches)
    // 4 distinct pairings appear across the two matches: {A,B} {C,D} {A,C} {B,D}.
    expect(standings).toHaveLength(4)
    for (const s of standings) expect(s.matchesPlayed).toBe(1)

    const abTeam = standings.find((s) => s.playerIds.join() === ['A', 'B'].sort().join())!
    expect(abTeam.gamesWon).toBe(4)
    expect(abTeam.matchesWon).toBe(1)

    const acTeam = standings.find((s) => s.playerIds.join() === ['A', 'C'].sort().join())!
    expect(acTeam.gamesWon).toBe(2)
    expect(acTeam.matchesWon).toBe(0)
  })

  it('is order-independent: [A,B] and [B,A] are the same team', () => {
    const matches: MatchResult[] = [
      { team1: ['A', 'B'], team2: ['C', 'D'], games1: 4, games2: 0, points1: 16, points2: 4, sets1: 1, sets2: 0, winnerTeam: 'team1' },
      { team1: ['B', 'A'], team2: ['E', 'F'], games1: 4, games2: 0, points1: 16, points2: 4, sets1: 1, sets2: 0, winnerTeam: 'team1' },
    ]
    const standings = computeTeamStandings(matches)
    const ab = standings.find((s) => s.playerIds.includes('A'))!
    expect(ab.matchesPlayed).toBe(2)
    expect(ab.playerIds).toEqual(['A', 'B']) // stored sorted, regardless of input order
  })

  it('reduces to one row per player for singles (team size 1), same numbers as computeStandings', () => {
    const matches: MatchResult[] = [
      { team1: ['A'], team2: ['B'], games1: 4, games2: 1, points1: 16, points2: 8, sets1: 1, sets2: 0, winnerTeam: 'team1' },
    ]
    const teamStandings = computeTeamStandings(matches)
    const playerStandings = computeStandings(matches)
    expect(teamStandings).toHaveLength(2)
    const a = teamStandings.find((s) => s.playerIds[0] === 'A')!
    const aIndividual = playerStandings.find((s) => s.playerId === 'A')!
    expect(a.gamesWon).toBe(aIndividual.gamesWon)
    expect(a.pointsWon).toBe(aIndividual.pointsWon)
    expect(a.matchesWon).toBe(aIndividual.matchesWon)
  })

  it('orders by Games Won, then Points Won, then Matches Won — same rule as individual ranking', () => {
    const matches: MatchResult[] = [
      { team1: ['A', 'B'], team2: ['C', 'D'], games1: 4, games2: 2, points1: 20, points2: 10, sets1: 1, sets2: 0, winnerTeam: 'team1' },
      { team1: ['A', 'B'], team2: ['C', 'D'], games1: 4, games2: 2, points1: 20, points2: 10, sets1: 1, sets2: 0, winnerTeam: 'team1' },
      { team1: ['E', 'F'], team2: ['G', 'H'], games1: 4, games2: 3, points1: 18, points2: 17, sets1: 1, sets2: 0, winnerTeam: 'team1' },
    ]
    const standings = computeTeamStandings(matches)
    // A&B: gamesWon=8 tops the table (only pair with 2 matches played together).
    expect(standings[0].playerIds).toEqual(['A', 'B'])
    expect(standings[0].gamesWon).toBe(8)
  })
})

describe('sets aggregation (multi-set matches)', () => {
  it('sums setsWon/setsLost across matches, both individually and by pair', () => {
    const matches: MatchResult[] = [
      // A&B win a best-of-3 2-1 over C&D.
      { team1: ['A', 'B'], team2: ['C', 'D'], games1: 12, games2: 9, points1: 60, points2: 50, sets1: 2, sets2: 1, winnerTeam: 'team1' },
      // A&B lose a single-set match to E&F (legacy-style, 1 set only).
      { team1: ['A', 'B'], team2: ['E', 'F'], games1: 2, games2: 4, points1: 10, points2: 16, sets1: 0, sets2: 1, winnerTeam: 'team2' },
    ]
    const individual = computeStandings(matches)
    const a = individual.find((s) => s.playerId === 'A')!
    expect(a.setsWon).toBe(2)
    expect(a.setsLost).toBe(2)

    const teams = computeTeamStandings(matches)
    const ab = teams.find((s) => s.playerIds.includes('A') && s.playerIds.includes('B'))!
    expect(ab.setsWon).toBe(2)
    expect(ab.setsLost).toBe(2)
  })
})
