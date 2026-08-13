export interface StandingsGroup<T> {
  matchesPlayed: number
  rows: T[]
}

/**
 * Splits standings into one group per distinct matchesPlayed count, ordered
 * from most matches played to fewest — used by the "mesmo número de
 * partidas" checkbox (Ranking screen + shareable report) so players who
 * attended less aren't hidden, just compared only within their own group
 * (each group keeps the input's relative order, i.e. still sorted by
 * GV/PtV/PV — see engine/ranking.ts — so ranking within a group stays
 * correct without re-sorting here).
 */
export function groupByMatchesPlayed<T extends { matchesPlayed: number }>(
  standings: T[],
): StandingsGroup<T>[] {
  const groups = new Map<number, T[]>()
  for (const s of standings) {
    const rows = groups.get(s.matchesPlayed) ?? []
    rows.push(s)
    groups.set(s.matchesPlayed, rows)
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([matchesPlayed, rows]) => ({ matchesPlayed, rows }))
}
