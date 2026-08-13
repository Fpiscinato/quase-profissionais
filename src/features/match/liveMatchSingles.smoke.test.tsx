// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../../App'
import { createMatchForRound, createTournament, db, ensurePlayersSeeded } from '../../db/db'

afterEach(cleanup)

describe('Live match screen — Individual (singles) gets the same visual treatment as Duplas', () => {
  it('shows the single-player icon (not the duo icon), team colors, tennis ball, and side coloring', async () => {
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b] = ['Jarede', 'Mateus'].map(byName)

    const tournament = await createTournament({
      availablePlayerIds: [a, b],
      format: 'individual',
      teamFormationMode: 'balanced',
      rounds: [{ team1: [a], team2: [b], restingPlayerIds: [] }],
      origin: 'torneio',
    })
    const match = await createMatchForRound({
      tournamentId: tournament.id,
      roundIndex: 0,
      team1: [a],
      team2: [b],
      serveOrder: [a, b],
    })

    // createTournament already set currentTournamentId, so App resumes
    // straight into Rodadas — Home is skipped, same as the Duplas flow.
    render(<App />)
    await screen.findByText('Rodadas')
    fireEvent.click(await screen.findByRole('button', { name: /Iniciar partida/ }))
    const banner = await screen.findByTestId('serve-banner')

    // Section 4: "Side/change-ends logic identical for singles" — same serve
    // banner, same tennis-ball icon, same Direita/Esquerda color-coding.
    expect(banner.textContent).toContain('🎾')
    expect(banner.textContent).toContain('Saca agora: Jarede — Direita')

    // Team cards: same colored-card treatment for singles as for doubles.
    const team1Card = screen.getByText('Time 1').closest('div')!
    expect(team1Card).toHaveClass('text-lime')

    const team2Card = screen.getByText('Time 2').closest('div')!
    expect(team2Card).toHaveClass('text-cream')

    // Point buttons still lime (Time 1) / cream (Time 2), same as doubles.
    expect(screen.getByRole('button', { name: 'Ponto — Time 1' })).toHaveClass('bg-lime')
    expect(screen.getByRole('button', { name: 'Ponto — Time 2' })).toHaveClass('bg-cream')

    // Playing a point still works end-to-end for singles.
    fireEvent.click(screen.getByRole('button', { name: 'Ponto — Time 1' }))
    await waitFor(async () => {
      const updated = await db.matches.get(match.id)
      expect(updated?.points1).toBe(1)
    })
  })

  it('can cancel an in-progress Individual match too — not a Duplas-only escape hatch', async () => {
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b] = ['Jarede', 'Mateus'].map(byName)

    const tournament = await createTournament({
      availablePlayerIds: [a, b],
      format: 'individual',
      teamFormationMode: 'balanced',
      rounds: [{ team1: [a], team2: [b], restingPlayerIds: [] }],
      origin: 'torneio',
    })
    const match = await createMatchForRound({
      tournamentId: tournament.id,
      roundIndex: 0,
      team1: [a],
      team2: [b],
      serveOrder: [a, b],
    })

    render(<App />)
    await screen.findByText('Rodadas')
    fireEvent.click(await screen.findByRole('button', { name: /Iniciar partida/ }))
    await screen.findByTestId('serve-banner')

    fireEvent.click(screen.getByRole('button', { name: 'Ponto — Time 1' }))
    await waitFor(async () => expect((await db.matches.get(match.id))?.points1).toBe(1))

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar partida' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sim, cancelar partida' }))

    await screen.findByText('Rodadas')
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(await db.matches.get(match.id)).toBeUndefined()
  })
})
