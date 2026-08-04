// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
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
})
