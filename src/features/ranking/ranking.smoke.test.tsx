// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react'
import App from '../../App'
import { db, ensurePlayersSeeded } from '../../db/db'
import { DEFAULT_MATCH_CONFIG } from '../../engine/types'

afterEach(cleanup)

/**
 * Two completed tournaments: an older one and today's. Numbers are chosen so
 * "geral" (summed) standings have no ties, while "dia" (today only) leaves
 * partners genuinely tied — a real, deterministic tie, not a test artifact.
 */
async function seedTwoTournaments() {
  // Each test calls this independently — start from a clean slate so the two
  // tests in this file don't accumulate data in the shared fake-indexeddb.
  await db.matches.clear()
  await db.tournaments.clear()
  await db.players.clear()
  await ensurePlayersSeeded()
  const players = await db.players.toArray()
  const byName = (n: string) => players.find((p) => p.name === n)!.id
  const [a, b, c, d] = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson'].map(byName)

  const t1Id = crypto.randomUUID()
  await db.tournaments.add({
    id: t1Id,
    date: '2026-07-01',
    availablePlayerIds: [a, b, c, d],
    format: 'duplas',
    teamFormationMode: 'balanced',
    options: DEFAULT_MATCH_CONFIG,
    rounds: [{ index: 0, team1: [a, b], team2: [c, d], restingPlayerIds: [] }],
    status: 'in_progress',
    createdAt: Date.now() - 1_000_000, // clearly older than tournament 2
  })
  await db.matches.add({
    id: crypto.randomUUID(),
    tournamentId: t1Id,
    roundIndex: 0,
    team1: [a, b],
    team2: [c, d],
    serveOrder: [a, c, b, d],
    pointLog: [],
    games1: 4,
    games2: 1,
    points1: 16,
    points2: 8,
    winnerTeam: 'team1',
    status: 'completed',
  })

  const t2Id = crypto.randomUUID()
  await db.tournaments.add({
    id: t2Id,
    date: '2026-08-04',
    availablePlayerIds: [a, b, c, d],
    format: 'duplas',
    teamFormationMode: 'balanced',
    options: DEFAULT_MATCH_CONFIG,
    rounds: [{ index: 0, team1: [a, c], team2: [b, d], restingPlayerIds: [] }],
    status: 'in_progress',
    createdAt: Date.now(), // "today"
  })
  await db.matches.add({
    id: crypto.randomUUID(),
    tournamentId: t2Id,
    roundIndex: 0,
    team1: [a, c],
    team2: [b, d],
    serveOrder: [a, b, c, d],
    pointLog: [],
    games1: 2,
    games2: 4,
    points1: 9,
    points2: 17,
    winnerTeam: 'team2',
    status: 'completed',
  })
}

// usePlayers() resolves its own liveQuery separately from (and sometimes
// slightly after) the standings table's, so rows can briefly render with
// "?" placeholders — wait for names to actually settle before reading rows.
async function dataRows() {
  await waitFor(() => {
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    const hasPlaceholder = rows.some((r) =>
      within(r).getAllByRole('cell')[1].textContent?.includes('?'),
    )
    expect(hasPlaceholder).toBe(false)
  })
  return within(screen.getByRole('table')).getAllByRole('row').slice(1)
}

describe('Ranking screen — "do dia" vs "geral", wired to Dexie (Section 6)', () => {
  it('scopes "do dia" to the most recent tournament only, tied partners grouped together', async () => {
    await seedTwoTournaments()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking' }))
    await screen.findByText('Ranking do dia')
    await screen.findByRole('table')

    // Mateus & Emerson (team2 of the T2-only match) both won 4 games / 17
    // points — a genuine tie, order between the two is not asserted.
    const rows = await dataRows()
    const nameOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1].textContent
    expect([nameOf(rows[0]), nameOf(rows[1])].sort()).toEqual(['Emerson', 'Mateus'])
    expect([nameOf(rows[2]), nameOf(rows[3])].sort()).toEqual(['Jarede', 'Mateus Adv'])

    const topCells = within(rows[0]).getAllByRole('cell')
    expect(topCells[4].textContent).toBe('4') // Games Won
    expect(topCells[5].textContent).toBe('2') // Games Lost
    expect(topCells[6].textContent).toBe('17') // Points Won
  })

  it('"geral" sums every tournament — Games Won ordering with no ties', async () => {
    await seedTwoTournaments()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking geral' }))
    await screen.findByRole('table')

    const rows = await dataRows()
    const nameOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1].textContent
    // Mateus won both matches (T1 as A's partner, T2 as D's partner) -> most games.
    expect(rows.map(nameOf)).toEqual(['Mateus', 'Jarede', 'Emerson', 'Mateus Adv'])

    const mateus = within(rows[0]).getAllByRole('cell')
    expect(mateus[2].textContent).toBe('2') // Matches Played
    expect(mateus[3].textContent).toBe('2') // Matches Won (won both)
    expect(mateus[4].textContent).toBe('8') // Games Won: 4 (T1) + 4 (T2)
    expect(mateus[5].textContent).toBe('3') // Games Lost: 1 (T1) + 2 (T2)
    expect(mateus[6].textContent).toBe('33') // Points Won: 16 (T1) + 17 (T2)
  })

  it('"Duplas" mode ranks by exact pairing instead of by individual player', async () => {
    await seedTwoTournaments()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking geral' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Duplas' }))
    await screen.findByRole('table')

    // The 4 pairings across T1+T2 never repeat, so each plays exactly once —
    // ranked by Games Won, tiebroken by Points Won (Section 6's rule, same
    // one computeStandings uses, just applied per-pairing instead of per-player).
    const rows = await dataRows()
    const pairOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1].textContent
    expect(rows.map(pairOf)).toEqual([
      'Emerson & Mateus', // team2 of T2: gamesWon 4, pointsWon 17
      'Jarede & Mateus', // team1 of T1: gamesWon 4, pointsWon 16 (loses the games-won tie on points)
      'Jarede & Mateus Adv', // team1 of T2: gamesWon 2
      'Emerson & Mateus Adv', // team2 of T1: gamesWon 1
    ])

    const top = within(rows[0]).getAllByRole('cell')
    expect(top[2].textContent).toBe('1') // Matches Played together
    expect(top[4].textContent).toBe('4') // Games Won
    expect(top[6].textContent).toBe('17') // Points Won
  })
})

describe('Ranking screen — "mesmo número de jogos" filter', () => {
  it('hides players who played fewer matches than the majority when checked', async () => {
    await db.matches.clear()
    await db.tournaments.clear()
    await db.players.clear()
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b, c, d, e] = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson', 'Fernando'].map(byName)

    const tId = crypto.randomUUID()
    await db.tournaments.add({
      id: tId,
      date: '2026-08-10',
      availablePlayerIds: [a, b, c, d, e],
      format: 'duplas',
      teamFormationMode: 'balanced',
      options: DEFAULT_MATCH_CONFIG,
      rounds: [
        { index: 0, team1: [a, b], team2: [c, d], restingPlayerIds: [e] },
        { index: 1, team1: [a, c], team2: [b, e], restingPlayerIds: [d] },
      ],
      status: 'in_progress',
      createdAt: Date.now(),
    })
    // Round 1: A&B beat C&D — E rests.
    await db.matches.add({
      id: crypto.randomUUID(),
      tournamentId: tId,
      roundIndex: 0,
      team1: [a, b],
      team2: [c, d],
      serveOrder: [a, c, b, d],
      pointLog: [],
      games1: 4,
      games2: 1,
      points1: 16,
      points2: 8,
      winnerTeam: 'team1',
      status: 'completed',
    })
    // Round 2: A&C beat B&E — D rests. Final tally: A,B,C played 2 matches
    // each (A,B in round 1; A,C in round 2; B moves from team1 to team2), D
    // and E played only 1 each.
    await db.matches.add({
      id: crypto.randomUUID(),
      tournamentId: tId,
      roundIndex: 1,
      team1: [a, c],
      team2: [b, e],
      serveOrder: [a, b, c, e],
      pointLog: [],
      games1: 4,
      games2: 1,
      points1: 16,
      points2: 8,
      winnerTeam: 'team1',
      status: 'completed',
    })

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking geral' }))
    await screen.findByRole('table')

    // Uneven attendance (A,B,C played 2; D,E played 1) — checkbox should show.
    const checkbox = await screen.findByRole('checkbox', {
      name: 'Comparar só quem jogou o mesmo número de partidas',
    })
    expect((await dataRows()).length).toBe(5)

    fireEvent.click(checkbox)
    await screen.findByText('Mostrando 3 de 5 jogadores, com 2 partidas cada.')
    const filteredRows = await dataRows()
    const nameOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1].textContent
    expect(filteredRows.map(nameOf).sort()).toEqual(['Jarede', 'Mateus', 'Mateus Adv'])

    fireEvent.click(checkbox)
    await waitFor(() => expect((screen.queryAllByRole('row').length) - 1).toBe(5))
  })
})
