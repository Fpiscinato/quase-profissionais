import { describe, expect, it } from 'vitest'
import { groupByMatchesPlayed } from './rankingFilter'

interface Row {
  id: string
  matchesPlayed: number
}

describe('groupByMatchesPlayed', () => {
  it('returns no groups for an empty list', () => {
    expect(groupByMatchesPlayed<Row>([])).toEqual([])
  })

  it('keeps a single group when everyone played the same number of matches', () => {
    const rows: Row[] = [{ id: 'a', matchesPlayed: 3 }, { id: 'b', matchesPlayed: 3 }]
    expect(groupByMatchesPlayed(rows)).toEqual([{ matchesPlayed: 3, rows }])
  })

  it('splits into groups ordered from most matches played to fewest, preserving row order within each group', () => {
    const a = { id: 'a', matchesPlayed: 2 }
    const b = { id: 'b', matchesPlayed: 3 }
    const c = { id: 'c', matchesPlayed: 2 }
    const d = { id: 'd', matchesPlayed: 3 }
    // Input already sorted by ranking (e.g. GV desc) — the grouping must not reorder within a group.
    const groups = groupByMatchesPlayed([b, d, a, c])
    expect(groups).toEqual([
      { matchesPlayed: 3, rows: [b, d] },
      { matchesPlayed: 2, rows: [a, c] },
    ])
  })
})
