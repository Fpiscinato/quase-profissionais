// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react'
import App from '../../App'
import { db, ensurePlayersSeeded } from '../../db/db'
import { DEFAULT_MATCH_CONFIG } from '../../engine/types'

// html-to-image needs real canvas/SVG rasterization, unavailable in jsdom —
// mock it so the smoke test can verify RankingScreen's orchestration (report
// data assembled, file shared) without depending on real image rendering.
vi.mock('html-to-image', () => ({
  toBlob: vi.fn().mockResolvedValue(new Blob(['fake-png'], { type: 'image/png' })),
}))

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
    await screen.findByRole('button', { name: 'Do dia' })
    await screen.findByRole('table')

    // Mateus & Emerson (team2 of the T2-only match) both won 4 games / 17
    // points — a genuine tie, order between the two is not asserted.
    const rows = await dataRows()
    const nameOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1].textContent
    expect([nameOf(rows[0]), nameOf(rows[1])].sort()).toEqual(['Emerson', 'Mateus'])
    expect([nameOf(rows[2]), nameOf(rows[3])].sort()).toEqual(['Jarede', 'Mateus Adv'])

    const topCells = within(rows[0]).getAllByRole('cell')
    expect(topCells[6].textContent).toBe('4') // Games Won
    expect(topCells[7].textContent).toBe('2') // Games Lost
    expect(topCells[8].textContent).toBe('17') // Points Won
  })

  it('"geral" sums every tournament — Games Won ordering with no ties', async () => {
    await seedTwoTournaments()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Geral' }))
    await screen.findByRole('table')

    const rows = await dataRows()
    const nameOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1].textContent
    // Mateus won both matches (T1 as A's partner, T2 as D's partner) -> most games.
    expect(rows.map(nameOf)).toEqual(['Mateus', 'Jarede', 'Emerson', 'Mateus Adv'])

    const mateus = within(rows[0]).getAllByRole('cell')
    expect(mateus[2].textContent).toBe('2') // Matches Played
    expect(mateus[3].textContent).toBe('2') // Matches Won (won both)
    expect(mateus[6].textContent).toBe('8') // Games Won: 4 (T1) + 4 (T2)
    expect(mateus[7].textContent).toBe('3') // Games Lost: 1 (T1) + 2 (T2)
    expect(mateus[8].textContent).toBe('33') // Points Won: 16 (T1) + 17 (T2)
  })

  it('"Duplas" mode ranks by exact pairing instead of by individual player', async () => {
    await seedTwoTournaments()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Geral' }))
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
    expect(top[6].textContent).toBe('4') // Games Won
    expect(top[8].textContent).toBe('17') // Points Won
  })

  it('"Duplas" mode never shows a solo player from an Individual-format match', async () => {
    await db.matches.clear()
    await db.tournaments.clear()
    await db.players.clear()
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b, c] = ['Jarede', 'Mateus', 'Mateus Adv'].map(byName)

    // A real pair (Jarede & Mateus) plus a singles match (Jarede vs Mateus Adv).
    const tId = crypto.randomUUID()
    await db.tournaments.add({
      id: tId,
      date: '2026-08-13',
      availablePlayerIds: [a, b, c],
      format: 'duplas',
      teamFormationMode: 'manual',
      options: DEFAULT_MATCH_CONFIG,
      rounds: [{ index: 0, team1: [a, b], team2: [c], restingPlayerIds: [] }],
      status: 'in_progress',
      createdAt: Date.now(),
    })
    await db.matches.add({
      id: crypto.randomUUID(),
      tournamentId: tId,
      roundIndex: 0,
      team1: [a, b],
      team2: [c], // singles side — a 1-player "team"
      serveOrder: [a, c, b],
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
    fireEvent.click(await screen.findByRole('button', { name: 'Geral' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Duplas' }))
    await screen.findByRole('table')

    const rows = await dataRows()
    const pairOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1].textContent
    expect(rows.map(pairOf)).toEqual(['Jarede & Mateus'])
    expect(screen.queryByText('Mateus Adv')).not.toBeInTheDocument()
  })
})

describe('Ranking screen — "Somente partidas de torneio"', () => {
  it('excludes matches from Praticar (origin "avulsa") tournaments when checked', async () => {
    await db.matches.clear()
    await db.tournaments.clear()
    await db.players.clear()
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b, c, d] = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson'].map(byName)

    const realTournamentId = crypto.randomUUID()
    await db.tournaments.add({
      id: realTournamentId,
      date: '2026-08-13',
      availablePlayerIds: [a, b, c, d],
      format: 'duplas',
      teamFormationMode: 'balanced',
      options: DEFAULT_MATCH_CONFIG,
      rounds: [{ index: 0, team1: [a, b], team2: [c, d], restingPlayerIds: [] }],
      status: 'in_progress',
      createdAt: Date.now() - 1000,
      origin: 'torneio',
    })
    await db.matches.add({
      id: crypto.randomUUID(),
      tournamentId: realTournamentId,
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

    const practiceTournamentId = crypto.randomUUID()
    await db.tournaments.add({
      id: practiceTournamentId,
      date: '2026-08-13',
      availablePlayerIds: [a, c],
      format: 'individual',
      teamFormationMode: 'manual',
      options: DEFAULT_MATCH_CONFIG,
      rounds: [{ index: 0, team1: [a], team2: [c], restingPlayerIds: [] }],
      status: 'in_progress',
      createdAt: Date.now(),
      origin: 'avulsa',
    })
    await db.matches.add({
      id: crypto.randomUUID(),
      tournamentId: practiceTournamentId,
      roundIndex: 0,
      team1: [a],
      team2: [c],
      serveOrder: [a, c],
      pointLog: [],
      games1: 4,
      games2: 0,
      points1: 16,
      points2: 4,
      winnerTeam: 'team1',
      status: 'completed',
    })

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Geral' }))
    await screen.findByRole('table')

    // Both matches count by default (checkbox off) — Jarede played 2.
    let rows = await dataRows()
    let nameOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1].textContent
    let jaredeRow = rows.find((r) => nameOf(r) === 'Jarede')!
    expect(within(jaredeRow).getAllByRole('cell')[2].textContent).toBe('2') // PJ

    fireEvent.click(screen.getByRole('checkbox', { name: 'Somente partidas de torneio' }))
    rows = await dataRows()
    nameOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1].textContent
    // Jarede and Mateus Adv played both matches -> drop to 1 (avulsa excluded).
    jaredeRow = rows.find((r) => nameOf(r) === 'Jarede')!
    expect(within(jaredeRow).getAllByRole('cell')[2].textContent).toBe('1')
    const mateusAdvRow = rows.find((r) => nameOf(r) === 'Mateus Adv')!
    expect(within(mateusAdvRow).getAllByRole('cell')[2].textContent).toBe('1')
    // Emerson only ever played the torneio match -> unaffected, still shown.
    const emersonRow = rows.find((r) => nameOf(r) === 'Emerson')!
    expect(within(emersonRow).getAllByRole('cell')[2].textContent).toBe('1')
  })
})

describe('Ranking screen — "do dia" scoped by date, with a day selector', () => {
  it('defaults to the most recent date played and lets you switch to an earlier one', async () => {
    await seedTwoTournaments()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking' }))
    await screen.findByRole('table')

    // Two distinct dates (2026-07-01 and 2026-08-04) -> selector shows up,
    // defaulting to the most recent (matches the old "latest tournament" result).
    const select = await screen.findByRole('combobox', { name: 'Ranking do dia' })
    expect((select as HTMLSelectElement).value).toBe('2026-08-04')
    let rows = await dataRows()
    const nameOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1].textContent
    expect([nameOf(rows[0]), nameOf(rows[1])].sort()).toEqual(['Emerson', 'Mateus'])

    // Switching to the earlier date re-scopes the ranking to that day's match only.
    fireEvent.change(select, { target: { value: '2026-07-01' } })
    rows = await dataRows()
    expect(rows.map(nameOf)).toEqual(['Jarede', 'Mateus', 'Mateus Adv', 'Emerson'])
    const top = within(rows[0]).getAllByRole('cell')
    expect(top[6].textContent).toBe('4') // Games Won, from the 2026-07-01 match
  })

  it('hides the selector when there is only one date with matches', async () => {
    await db.matches.clear()
    await db.tournaments.clear()
    await db.players.clear()
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b, c, d] = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson'].map(byName)
    const tId = crypto.randomUUID()
    await db.tournaments.add({
      id: tId,
      date: '2026-08-13',
      availablePlayerIds: [a, b, c, d],
      format: 'duplas',
      teamFormationMode: 'balanced',
      options: DEFAULT_MATCH_CONFIG,
      rounds: [{ index: 0, team1: [a, b], team2: [c, d], restingPlayerIds: [] }],
      status: 'in_progress',
      createdAt: Date.now(),
    })
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

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking' }))
    await screen.findByRole('table')
    expect(screen.queryByRole('combobox', { name: 'Ranking do dia' })).not.toBeInTheDocument()
  })
})

describe('Ranking screen — "mesmo número de jogos" grouping', () => {
  it('groups players by matches played instead of hiding anyone, numbering restarting per group', async () => {
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
    fireEvent.click(await screen.findByRole('button', { name: 'Geral' }))
    await screen.findByRole('table')

    // Uneven attendance (A,B,C played 2; D,E played 1) — checkbox should show.
    const checkbox = await screen.findByRole('checkbox', {
      name: 'Agrupar por número de partidas jogadas',
    })
    expect((await dataRows()).length).toBe(5)

    fireEvent.click(checkbox)
    // Nobody disappears — still 5 data rows, plus 2 group-header rows (5, 2 partidas).
    await screen.findByText('2 partidas')
    await screen.findByText('1 partida')
    const rowsAfterGrouping = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(rowsAfterGrouping.length).toBe(7) // 2 header rows + 5 data rows

    // Data rows have all 10 columns; group-header rows have only 3 <td>s
    // (empty sticky #, the label, and a colspan filler — see RankingScreen.tsx).
    const dataRowsGrouped = rowsAfterGrouping.filter((r) => within(r).getAllByRole('cell').length === 10)
    const nameOf = (row: HTMLElement) => within(row).getAllByRole('cell')[1].textContent
    const posOf = (row: HTMLElement) => within(row).getAllByRole('cell')[0].textContent
    expect(dataRowsGrouped.map(nameOf).sort()).toEqual(['Emerson', 'Fernando', 'Jarede', 'Mateus', 'Mateus Adv'])
    // First row of the "2 partidas" group and first row of the "1 partida"
    // group both restart numbering at #1 — no continuous position across groups.
    expect(dataRowsGrouped.filter((r) => posOf(r) === '1').length).toBe(2)

    fireEvent.click(checkbox)
    await waitFor(() => expect((screen.queryAllByRole('row').length) - 1).toBe(5))
  })
})

describe('Ranking screen — Compartilhar (image report)', () => {
  afterEach(() => {
    delete (navigator as { share?: unknown }).share
    delete (navigator as { canShare?: unknown }).canShare
  })

  it('builds a PNG report and shares it via the native share sheet', async () => {
    await db.matches.clear()
    await db.tournaments.clear()
    await db.players.clear()
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b, c, d] = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson'].map(byName)

    const tId = crypto.randomUUID()
    await db.tournaments.add({
      id: tId,
      date: '2026-08-13',
      availablePlayerIds: [a, b, c, d],
      format: 'duplas',
      teamFormationMode: 'balanced',
      options: DEFAULT_MATCH_CONFIG,
      rounds: [{ index: 0, team1: [a, b], team2: [c, d], restingPlayerIds: [] }],
      status: 'in_progress',
      createdAt: Date.now(),
    })
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
      durationSeconds: 1800,
    })

    const share = vi.fn().mockResolvedValue(undefined)
    navigator.share = share
    navigator.canShare = () => true

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ranking' }))
    await screen.findByRole('table')

    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))
    await waitFor(() => expect(share).toHaveBeenCalled())

    const call = share.mock.calls[0][0]
    expect(call.files).toHaveLength(1)
    expect(call.files[0].type).toBe('image/png')
    expect(call.files[0].name).toMatch(/^quase-profissionais-ranking-.*\.png$/)

    // The offscreen report node is torn down again once sharing finishes.
    await waitFor(() => expect(screen.queryByText('Gerando...')).not.toBeInTheDocument())
  })
})
