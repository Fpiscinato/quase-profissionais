import { describe, expect, it } from 'vitest'
import { computePlayerPlayTime, computeTeamPlayTime, totalPlaySeconds } from './stats'
import type { DurationInput } from './stats'

describe('totalPlaySeconds', () => {
  it('sums durationSeconds across every match', () => {
    const matches: DurationInput[] = [
      { team1: ['A', 'B'], team2: ['C', 'D'], durationSeconds: 600 },
      { team1: ['A', 'C'], team2: ['B', 'D'], durationSeconds: 900 },
    ]
    expect(totalPlaySeconds(matches)).toBe(1500)
  })

  it('is 0 for no matches', () => {
    expect(totalPlaySeconds([])).toBe(0)
  })
})

describe('computePlayerPlayTime', () => {
  it('credits every player in a match, on either side, with that match\'s full duration', () => {
    const matches: DurationInput[] = [
      { team1: ['A', 'B'], team2: ['C', 'D'], durationSeconds: 600 },
      { team1: ['A', 'C'], team2: ['B', 'D'], durationSeconds: 900 },
    ]
    const times = computePlayerPlayTime(matches)
    const a = times.find((t) => t.playerId === 'A')!
    // A played in both matches -> 600 + 900.
    expect(a.totalSeconds).toBe(1500)
    expect(a.matchesPlayed).toBe(2)

    const c = times.find((t) => t.playerId === 'C')!
    expect(c.totalSeconds).toBe(1500)
    expect(c.matchesPlayed).toBe(2)
  })

  it('sorts by total time descending', () => {
    const matches: DurationInput[] = [
      { team1: ['A'], team2: ['B'], durationSeconds: 300 },
      { team1: ['A'], team2: ['C'], durationSeconds: 900 },
    ]
    const times = computePlayerPlayTime(matches)
    // A played both (1200s total) -> first. B only 300s, C only 900s.
    expect(times[0].playerId).toBe('A')
    expect(times[0].totalSeconds).toBe(1200)
    expect(times[1].playerId).toBe('C')
    expect(times[2].playerId).toBe('B')
  })
})

describe('computeTeamPlayTime', () => {
  it('combines time for the SAME pair across multiple matches into one row', () => {
    const matches: DurationInput[] = [
      { team1: ['A', 'B'], team2: ['C', 'D'], durationSeconds: 600 },
      { team1: ['A', 'B'], team2: ['E', 'F'], durationSeconds: 300 },
    ]
    const times = computeTeamPlayTime(matches)
    const ab = times.find((t) => t.playerIds.includes('A') && t.playerIds.includes('B'))!
    expect(ab.totalSeconds).toBe(900)
    expect(ab.matchesPlayed).toBe(2)
    // A&B combined into one row rather than counted twice separately from {C,D}/{E,F}.
    expect(times).toHaveLength(3)
  })

  it('treats different pairings of the same players as different teams (no cross-crediting)', () => {
    const matches: DurationInput[] = [
      { team1: ['A', 'B'], team2: ['C', 'D'], durationSeconds: 600 },
      { team1: ['A', 'C'], team2: ['B', 'D'], durationSeconds: 900 },
    ]
    const times = computeTeamPlayTime(matches)
    const ab = times.find((t) => t.playerIds.join() === ['A', 'B'].sort().join())!
    const ac = times.find((t) => t.playerIds.join() === ['A', 'C'].sort().join())!
    expect(ab.totalSeconds).toBe(600)
    expect(ac.totalSeconds).toBe(900)
  })

  it('is order-independent: [A,B] and [B,A] accumulate into the same row', () => {
    const matches: DurationInput[] = [
      { team1: ['A', 'B'], team2: ['C', 'D'], durationSeconds: 600 },
      { team1: ['B', 'A'], team2: ['E', 'F'], durationSeconds: 400 },
    ]
    const times = computeTeamPlayTime(matches)
    const ab = times.find((t) => t.playerIds.includes('A'))!
    expect(ab.totalSeconds).toBe(1000)
    expect(ab.playerIds).toEqual(['A', 'B'])
  })

  it('reduces to one-player rows for singles (team size 1)', () => {
    const matches: DurationInput[] = [{ team1: ['A'], team2: ['B'], durationSeconds: 500 }]
    const times = computeTeamPlayTime(matches)
    expect(times).toHaveLength(2)
    expect(times.find((t) => t.playerIds.length === 1 && t.playerIds[0] === 'A')).toBeTruthy()
  })
})
