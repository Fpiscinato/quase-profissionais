import type { PlayerId } from './types'

export interface DurationInput {
  team1: PlayerId[]
  team2: PlayerId[]
  durationSeconds: number
}

/** Sum of durationSeconds across every match given (Section 11: total play time). */
export function totalPlaySeconds(matches: DurationInput[]): number {
  return matches.reduce((sum, m) => sum + m.durationSeconds, 0)
}

export interface PlayerPlayTime {
  playerId: PlayerId
  totalSeconds: number
  matchesPlayed: number
}

/** Total time on court per player, counting every match they were in on either side. */
export function computePlayerPlayTime(matches: DurationInput[]): PlayerPlayTime[] {
  const byPlayer = new Map<PlayerId, PlayerPlayTime>()
  for (const match of matches) {
    for (const playerId of [...match.team1, ...match.team2]) {
      const entry = byPlayer.get(playerId) ?? { playerId, totalSeconds: 0, matchesPlayed: 0 }
      entry.totalSeconds += match.durationSeconds
      entry.matchesPlayed += 1
      byPlayer.set(playerId, entry)
    }
  }
  return Array.from(byPlayer.values()).sort((a, b) => b.totalSeconds - a.totalSeconds)
}

export interface TeamPlayTime {
  playerIds: PlayerId[]
  totalSeconds: number
  matchesPlayed: number
}

/**
 * Total time on court per exact pairing (Section 11, "por dupla"): the same
 * two players only share a row if they played together as a team. Singles
 * matches (team size 1) naturally produce one-player "team" rows, same as
 * computeTeamStandings.
 */
export function computeTeamPlayTime(matches: DurationInput[]): TeamPlayTime[] {
  const byTeam = new Map<string, TeamPlayTime>()
  const keyOf = (ids: PlayerId[]) => [...ids].sort().join('|')
  for (const match of matches) {
    for (const ids of [match.team1, match.team2]) {
      const key = keyOf(ids)
      const entry = byTeam.get(key) ?? { playerIds: [...ids].sort(), totalSeconds: 0, matchesPlayed: 0 }
      entry.totalSeconds += match.durationSeconds
      entry.matchesPlayed += 1
      byTeam.set(key, entry)
    }
  }
  return Array.from(byTeam.values()).sort((a, b) => b.totalSeconds - a.totalSeconds)
}
