import { describe, expect, it } from 'vitest'
import { generateDoublesRotation, generateFixedPairsRotation, generateSinglesRotation } from './schedule'

describe('generateDoublesRotation — canonical 5-player schedule (Section 2)', () => {
  const players = ['A', 'B', 'C', 'D', 'E']
  const rounds = generateDoublesRotation(players)

  it('produces exactly 5 rounds', () => {
    expect(rounds).toHaveLength(5)
  })

  it('R1: A&B vs C&D — E rests', () => {
    expect(rounds[0]).toEqual({
      roundIndex: 0,
      team1: ['A', 'B'],
      team2: ['C', 'D'],
      restingPlayerIds: ['E'],
    })
  })

  it('R2: A&C vs B&E — D rests', () => {
    expect(rounds[1]).toEqual({
      roundIndex: 1,
      team1: ['A', 'C'],
      team2: ['B', 'E'],
      restingPlayerIds: ['D'],
    })
  })

  it('R3: A&E vs B&D — C rests', () => {
    expect(rounds[2]).toEqual({
      roundIndex: 2,
      team1: ['A', 'E'],
      team2: ['B', 'D'],
      restingPlayerIds: ['C'],
    })
  })

  it('R4: A&D vs C&E — B rests', () => {
    expect(rounds[3]).toEqual({
      roundIndex: 3,
      team1: ['A', 'D'],
      team2: ['C', 'E'],
      restingPlayerIds: ['B'],
    })
  })

  it('R5: B&C vs D&E — A rests', () => {
    expect(rounds[4]).toEqual({
      roundIndex: 4,
      team1: ['B', 'C'],
      team2: ['D', 'E'],
      restingPlayerIds: ['A'],
    })
  })

  it('each player rests exactly once across the 5 rounds', () => {
    const rests = rounds.flatMap((r) => r.restingPlayerIds)
    expect(rests.sort()).toEqual(['A', 'B', 'C', 'D', 'E'])
  })

  it('each player partners each of the others exactly once', () => {
    const partnerships = new Set<string>()
    for (const round of rounds) {
      for (const team of [round.team1, round.team2]) {
        partnerships.add([...team].sort().join('-'))
      }
    }
    // C(5,2) = 10 unique pairs, all of which must appear as a partnership exactly once.
    expect(partnerships.size).toBe(10)
  })
})

describe('generateDoublesRotation — other player counts stay balanced', () => {
  it('4 players: 3 rounds, nobody rests, each partners each other once', () => {
    const rounds = generateDoublesRotation(['A', 'B', 'C', 'D'])
    expect(rounds).toHaveLength(3)
    for (const round of rounds) {
      expect(round.restingPlayerIds).toEqual([])
      expect(round.team1).toHaveLength(2)
      expect(round.team2).toHaveLength(2)
    }
    const partnerships = new Set(
      rounds.flatMap((r) => [r.team1, r.team2].map((t) => [...t].sort().join('-'))),
    )
    // 3 rounds x 2 teams = 6 partnership slots, covering all C(4,2) = 6 pairs.
    expect(partnerships.size).toBe(6)
  })

  it('6 players: nobody rests twice before everyone has rested once', () => {
    const players = ['A', 'B', 'C', 'D', 'E', 'F']
    const rounds = generateDoublesRotation(players)
    expect(rounds).toHaveLength(6)
    for (const round of rounds) {
      expect(round.restingPlayerIds).toHaveLength(2)
      expect(round.team1).toHaveLength(2)
      expect(round.team2).toHaveLength(2)
    }
    const restCounts = new Map<string, number>()
    for (const round of rounds) {
      for (const id of round.restingPlayerIds) {
        restCounts.set(id, (restCounts.get(id) ?? 0) + 1)
      }
    }
    // Over the first full cycle (6 rounds, 2 resting per round = 12 rest-slots
    // for 6 players), everyone rests exactly twice, evenly.
    for (const player of players) {
      expect(restCounts.get(player)).toBe(2)
    }
  })

  it('throws for fewer than 4 players', () => {
    expect(() => generateDoublesRotation(['A', 'B', 'C'])).toThrow()
  })
})

describe('generateFixedPairsRotation — duplas fixas', () => {
  it('2 pairs (4 players): a single round, pair vs pair, nobody rests', () => {
    const rounds = generateFixedPairsRotation([
      ['A', 'B'],
      ['C', 'D'],
    ])
    expect(rounds).toHaveLength(1)
    expect(rounds[0]).toEqual({
      roundIndex: 0,
      team1: ['A', 'B'],
      team2: ['C', 'D'],
      restingPlayerIds: [],
    })
  })

  it('3 pairs (6 players): round-robin between pairs, partners never separated', () => {
    const pairs: Array<[string, string]> = [
      ['A', 'B'],
      ['C', 'D'],
      ['E', 'F'],
    ]
    const rounds = generateFixedPairsRotation(pairs)
    expect(rounds).toHaveLength(3)

    for (const round of rounds) {
      // Every team that appears is always exactly one of the 3 fixed pairs —
      // partners are never split up or recombined with someone else.
      for (const team of [round.team1, round.team2]) {
        expect(pairs).toContainEqual(team)
      }
      expect(round.restingPlayerIds).toHaveLength(2)
      // The resting players are always a fixed pair too.
      expect(pairs).toContainEqual(round.restingPlayerIds)
    }

    const matchups = new Set(
      rounds.map((r) => [r.team1.join('&'), r.team2.join('&')].sort().join(' vs ')),
    )
    // C(3,2) = 3 unique pair-vs-pair matchups.
    expect(matchups.size).toBe(3)

    const restCounts = new Map<string, number>()
    for (const round of rounds) {
      for (const id of round.restingPlayerIds) {
        restCounts.set(id, (restCounts.get(id) ?? 0) + 1)
      }
    }
    for (const [a, b] of pairs) {
      expect(restCounts.get(a)).toBe(1)
      expect(restCounts.get(b)).toBe(1)
    }
  })

  it('throws for fewer than 2 pairs', () => {
    expect(() => generateFixedPairsRotation([['A', 'B']])).toThrow()
  })
})

describe('generateSinglesRotation — round robin (Section 2 / 8)', () => {
  it('2 players = 1 match', () => {
    const rounds = generateSinglesRotation(['A', 'B'])
    expect(rounds).toHaveLength(1)
    expect(rounds[0]).toEqual({
      roundIndex: 0,
      team1: ['A'],
      team2: ['B'],
      restingPlayerIds: [],
    })
  })

  it('3 players = 3 matches, each player rests exactly once', () => {
    const rounds = generateSinglesRotation(['A', 'B', 'C'])
    expect(rounds).toHaveLength(3)
    const rests = rounds.map((r) => r.restingPlayerIds)
    expect(rests).toEqual([['C'], ['B'], ['A']])
    for (const round of rounds) {
      expect(round.team1).toHaveLength(1)
      expect(round.team2).toHaveLength(1)
    }
  })

  it('4 players = 6 matches (everyone plays everyone once)', () => {
    const rounds = generateSinglesRotation(['A', 'B', 'C', 'D'])
    expect(rounds).toHaveLength(6)
    const matchups = new Set(
      rounds.map((r) => [r.team1[0], r.team2[0]].sort().join('-')),
    )
    expect(matchups.size).toBe(6)
  })

  it('throws for fewer than 2 players', () => {
    expect(() => generateSinglesRotation(['A'])).toThrow()
  })
})
