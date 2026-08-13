// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react'
import App from '../../App'
import { db, ensurePlayersSeeded } from '../../db/db'
import { DEFAULT_MATCH_CONFIG } from '../../engine/types'

afterEach(cleanup)

describe('History screen — play-time stats (Section 11), wired to Dexie', () => {
  it('shows total, per-player, and per-pair play time computed from completed matches', async () => {
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b, c, d] = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson'].map(byName)

    const tournamentId = crypto.randomUUID()
    await db.tournaments.add({
      id: tournamentId,
      date: '2026-08-04',
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
      tournamentId,
      roundIndex: 0,
      team1: [a, b],
      team2: [c, d],
      serveOrder: [a, c, b, d],
      pointLog: [],
      games1: 4,
      games2: 2,
      points1: 20,
      points2: 15,
      winnerTeam: 'team1',
      status: 'completed',
      durationSeconds: 1500, // 25min
    })

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Histórico' }))
    await screen.findByText('Tempo jogado (todos os torneios)')

    expect(screen.getByText('25min')).toBeInTheDocument() // total

    expect(screen.getByText('Jarede')).toBeInTheDocument()
    expect(screen.getAllByText('25min · 1 partida')).toHaveLength(6) // 4 players + 2 pairs

    expect(screen.getByText('Jarede & Mateus')).toBeInTheDocument()
    expect(screen.getByText('Emerson & Mateus Adv')).toBeInTheDocument()
  })

  it('groups tournaments by day and "Excluir dia" removes only that day\'s tournaments/matches', async () => {
    // Clear leftovers from the previous test in this file (fake-indexeddb
    // persists across `it` blocks) — players stay seeded, data doesn't.
    await db.matches.clear()
    await db.tournaments.clear()
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b] = ['Jarede', 'Mateus'].map(byName)

    const addTournamentWithMatch = async (date: string) => {
      const tournamentId = crypto.randomUUID()
      await db.tournaments.add({
        id: tournamentId,
        date,
        availablePlayerIds: [a, b],
        format: 'individual',
        teamFormationMode: 'balanced',
        options: DEFAULT_MATCH_CONFIG,
        rounds: [{ index: 0, team1: [a], team2: [b], restingPlayerIds: [] }],
        status: 'in_progress',
        createdAt: Date.now(),
      })
      const matchId = crypto.randomUUID()
      await db.matches.add({
        id: matchId,
        tournamentId,
        roundIndex: 0,
        team1: [a],
        team2: [b],
        serveOrder: [a, b],
        pointLog: [],
        games1: 4,
        games2: 1,
        points1: 16,
        points2: 8,
        winnerTeam: 'team1',
        status: 'completed',
        durationSeconds: 600,
      })
      return { tournamentId, matchId }
    }

    // Two tournaments on the same day (main tournament + a "partida avulsa"), one on another day.
    const day1a = await addTournamentWithMatch('2026-08-04')
    const day1b = await addTournamentWithMatch('2026-08-04')
    const day2 = await addTournamentWithMatch('2026-08-01')

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Histórico' }))
    await screen.findByText('Tempo jogado (todos os torneios)')

    // Grouped under exactly 2 date headings, most recent first.
    expect(screen.getByText('04/08/2026')).toBeInTheDocument()
    expect(screen.getByText('01/08/2026')).toBeInTheDocument()
    expect(screen.getAllByText('Individual')).toHaveLength(3) // 3 tournament cards total

    expect(screen.getAllByRole('button', { name: 'Excluir dia' })).toHaveLength(2)

    // Delete the 2026-08-04 day (the one with 2 tournaments) — find its
    // group by the date heading rather than assuming array/DOM order,
    // since groups are ordered by createdAt (most-recently-created first),
    // not calendar date.
    const day1Group = screen.getByText('04/08/2026').closest('div')!.parentElement!
    fireEvent.click(within(day1Group).getByRole('button', { name: 'Excluir dia' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sim, excluir dia' }))

    await waitFor(() => expect(screen.queryByText('04/08/2026')).toBeNull())
    expect(screen.getByText('01/08/2026')).toBeInTheDocument()

    // Only the deleted day's tournaments/matches are gone.
    expect(await db.tournaments.get(day1a.tournamentId)).toBeUndefined()
    expect(await db.tournaments.get(day1b.tournamentId)).toBeUndefined()
    expect(await db.matches.get(day1a.matchId)).toBeUndefined()
    expect(await db.matches.get(day1b.matchId)).toBeUndefined()
    expect(await db.tournaments.get(day2.tournamentId)).toBeDefined()
    expect(await db.matches.get(day2.matchId)).toBeDefined()
  })
})

describe('History screen — "Somente partidas de torneio" filters the tempo jogado card', () => {
  it('excludes Praticar (origin "avulsa") matches from the time-played stats when checked', async () => {
    await db.matches.clear()
    await db.tournaments.clear()
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b] = ['Jarede', 'Mateus'].map(byName)

    const addTournamentWithMatch = async (origin: 'torneio' | 'avulsa', durationSeconds: number) => {
      const tournamentId = crypto.randomUUID()
      await db.tournaments.add({
        id: tournamentId,
        date: '2026-08-13',
        availablePlayerIds: [a, b],
        format: 'individual',
        teamFormationMode: 'balanced',
        options: DEFAULT_MATCH_CONFIG,
        rounds: [{ index: 0, team1: [a], team2: [b], restingPlayerIds: [] }],
        status: 'in_progress',
        createdAt: Date.now(),
        origin,
      })
      await db.matches.add({
        id: crypto.randomUUID(),
        tournamentId,
        roundIndex: 0,
        team1: [a],
        team2: [b],
        serveOrder: [a, b],
        pointLog: [],
        games1: 4,
        games2: 1,
        points1: 16,
        points2: 8,
        winnerTeam: 'team1',
        status: 'completed',
        durationSeconds,
      })
    }

    await addTournamentWithMatch('torneio', 600) // 10min
    await addTournamentWithMatch('avulsa', 300) // 5min

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Histórico' }))
    await screen.findByText('Tempo jogado (todos os torneios)')

    // Both count by default.
    expect(screen.getByText('15min')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Somente partidas de torneio' }))
    await screen.findByText('10min')
    expect(screen.queryByText('15min')).not.toBeInTheDocument()
  })
})
