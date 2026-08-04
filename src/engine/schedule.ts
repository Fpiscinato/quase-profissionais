import type { PlayerId, ScheduledMatch } from './types'

/**
 * Canonical 5-player doubles schedule (Section 2), keyed by array position:
 * players[0..4] play the role of A..E. Each player rests exactly once and
 * partners each of the others exactly once across the 5 rounds.
 */
const CANONICAL_5_ROTATION: Array<{ team1: [number, number]; team2: [number, number]; rest: number }> = [
  { team1: [0, 1], team2: [2, 3], rest: 4 }, // R1: A&B vs C&D — E rests
  { team1: [0, 2], team2: [1, 4], rest: 3 }, // R2: A&C vs B&E — D rests
  { team1: [0, 4], team2: [1, 3], rest: 2 }, // R3: A&E vs B&D — C rests
  { team1: [0, 3], team2: [2, 4], rest: 1 }, // R4: A&D vs C&E — B rests
  { team1: [1, 2], team2: [3, 4], rest: 0 }, // R5: B&C vs D&E — A rests
]

/** The 3 ways to split 4 players into two partner pairs. */
const FOUR_WAY_PARTNER_PATTERNS: Array<[[number, number], [number, number]]> = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
]

/**
 * Doubles (Americano) rotation for one court. Callers should randomise
 * `playerIds` beforehand (Section 2: "randomise the seeding, then apply the
 * balanced schedule"); this function is deterministic given that order.
 *
 * n = 5 reproduces the exact canonical schedule. Other n use a balanced
 * rest-rotation (nobody rests twice before everyone has rested once) with
 * varied partner pairings among each round's 4 players.
 */
export function generateDoublesRotation(playerIds: PlayerId[]): ScheduledMatch[] {
  const n = playerIds.length
  if (n < 4) throw new Error('Doubles needs at least 4 available players')

  if (n === 5) {
    return CANONICAL_5_ROTATION.map((round, roundIndex) => ({
      roundIndex,
      team1: [playerIds[round.team1[0]], playerIds[round.team1[1]]],
      team2: [playerIds[round.team2[0]], playerIds[round.team2[1]]],
      restingPlayerIds: [playerIds[round.rest]],
    }))
  }

  if (n === 4) {
    return FOUR_WAY_PARTNER_PATTERNS.map((pattern, roundIndex) => ({
      roundIndex,
      team1: [playerIds[pattern[0][0]], playerIds[pattern[0][1]]],
      team2: [playerIds[pattern[1][0]], playerIds[pattern[1][1]]],
      restingPlayerIds: [],
    }))
  }

  const restersPerRound = n - 4
  const rounds: ScheduledMatch[] = []
  for (let roundIndex = 0; roundIndex < n; roundIndex++) {
    const restIndices = new Set<number>()
    for (let k = 0; k < restersPerRound; k++) {
      restIndices.add((roundIndex * restersPerRound + k) % n)
    }
    const playing = playerIds.filter((_, idx) => !restIndices.has(idx))
    const pattern = FOUR_WAY_PARTNER_PATTERNS[roundIndex % FOUR_WAY_PARTNER_PATTERNS.length]
    rounds.push({
      roundIndex,
      team1: [playing[pattern[0][0]], playing[pattern[0][1]]],
      team2: [playing[pattern[1][0]], playing[pattern[1][1]]],
      restingPlayerIds: playerIds.filter((_, idx) => restIndices.has(idx)),
    })
  }
  return rounds
}

/**
 * Individual (singles) round robin: everyone plays everyone else once, one
 * match at a time on the single court, resting players are everyone not
 * currently playing.
 */
export function generateSinglesRotation(playerIds: PlayerId[]): ScheduledMatch[] {
  const n = playerIds.length
  if (n < 2) throw new Error('Singles needs at least 2 available players')

  const rounds: ScheduledMatch[] = []
  let roundIndex = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const playing = new Set([playerIds[i], playerIds[j]])
      rounds.push({
        roundIndex,
        team1: [playerIds[i]],
        team2: [playerIds[j]],
        restingPlayerIds: playerIds.filter((id) => !playing.has(id)),
      })
      roundIndex++
    }
  }
  return rounds
}
