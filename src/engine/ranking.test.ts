import { describe, expect, it } from 'vitest'
import { computeStandings } from './ranking'
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
        winnerTeam: 'team1',
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
        winnerTeam: 'team1',
      },
    ]
    const standings = computeStandings(matches)
    expect(standings).toHaveLength(2)
    expect(standings[0].playerId).toBe('A')
  })

  it('orders by Games Won, then Points Won, then Matches Won', () => {
    const matches: MatchResult[] = [
      // A&B beat C&D 4-2, twice, and E&F beat G&H 4-3 once (more matches, fewer games/points).
      { team1: ['A', 'B'], team2: ['C', 'D'], games1: 4, games2: 2, points1: 20, points2: 10, winnerTeam: 'team1' },
      { team1: ['A', 'B'], team2: ['C', 'D'], games1: 4, games2: 2, points1: 20, points2: 10, winnerTeam: 'team1' },
      { team1: ['E', 'F'], team2: ['G', 'H'], games1: 4, games2: 3, points1: 18, points2: 17, winnerTeam: 'team1' },
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
      { team1: ['A'], team2: ['X'], games1: 4, games2: 0, points1: 16, points2: 4, winnerTeam: 'team1' },
      // B loses two matches that add up to the same games/points won but 0 matches won.
      { team1: ['B'], team2: ['Y'], games1: 2, games2: 4, points1: 8, points2: 18, winnerTeam: 'team2' },
      { team1: ['B'], team2: ['Z'], games1: 2, games2: 4, points1: 8, points2: 18, winnerTeam: 'team2' },
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
