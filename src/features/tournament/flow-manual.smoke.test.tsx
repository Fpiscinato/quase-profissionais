// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react'
import App from '../../App'
import { db, DEFAULT_PLAYER_NAMES } from '../../db/db'

afterEach(cleanup)

describe('Phase 2 flow — manual team formation and manual serve order', () => {
  it('lets the organiser hand-pick pairings each round and a valid serve order', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Torneio' }))
    await screen.findByText('Quem joga hoje?')
    for (const playerName of DEFAULT_PLAYER_NAMES) {
      fireEvent.click(await screen.findByLabelText(playerName))
    }
    fireEvent.click(screen.getByRole('button', { name: /Continuar \(5 jogadores\)/ }))

    await screen.findByText('Formato e rotação')
    fireEvent.click(screen.getByRole('button', { name: 'Manual' }))
    await screen.findByText(/Toque em 2 jogadores de cada rodada/)

    // Round 1 comes pre-filled with a valid (balanced) suggestion, so the
    // confirm button should already be enabled without any manual edits.
    const confirmButton = screen.getByRole('button', { name: 'Confirmar e criar torneio' })
    expect(confirmButton).toBeEnabled()

    // Exercise the toggle logic on round 1: flip one player from Team 2 into
    // Team 1 (bumping someone else out), then flip them back.
    const round1Heading = screen.getByText('Rodada 1')
    const round1Card = round1Heading.closest('div')!.parentElement!
    const playerButtons = within(round1Card).getAllByRole('button')
    expect(playerButtons).toHaveLength(4)

    const initiallyTeam2 = playerButtons.find((b) => !b.textContent?.includes('Time 1'))!
    const initiallyTeam1 = playerButtons.find((b) => b.textContent?.includes('Time 1'))!

    fireEvent.click(initiallyTeam2) // team1 now has 3 candidates? No: capped at 2, so this is a no-op.
    // Team 1 was already full (2 players), so clicking a Team-2 player must be a no-op.
    expect(confirmButton).toBeEnabled()

    fireEvent.click(initiallyTeam1) // remove one from Team 1 (now size 1)
    expect(screen.getByRole('button', { name: 'Confirmar e criar torneio' })).toBeDisabled()

    fireEvent.click(initiallyTeam2) // add the other one back in (now size 2 again)
    expect(screen.getByRole('button', { name: 'Confirmar e criar torneio' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e criar torneio' }))

    await screen.findByText('Rodadas')
    const tournament = (await db.tournaments.toArray())[0]
    expect(tournament.teamFormationMode).toBe('manual')
    expect(tournament.rounds).toHaveLength(5)
    for (const round of tournament.rounds) {
      expect(round.team1).toHaveLength(2)
      expect(round.team2).toHaveLength(2)
    }

    // Now configure round 1's match with a manually-chosen serve order.
    fireEvent.click(screen.getAllByRole('button', { name: 'Configurar partida' })[0])
    await screen.findByText(/Configurar partida — Rodada 1/)
    fireEvent.click(screen.getByRole('button', { name: 'Escolher' }))

    const [p1, p2, p3, p4] = tournament.rounds[0].team1.concat(tournament.rounds[0].team2)
    const teamOf = (id: string) => (tournament.rounds[0].team1.includes(id) ? 'team1' : 'team2')

    // Pick in a valid alternating order: p1 (team X), then a team-Y player.
    const order = [p1, [p2, p3, p4].find((id) => teamOf(id) !== teamOf(p1))!]
    order.push([p2, p3, p4].find((id) => teamOf(id) === teamOf(p1) && id !== p1)!)
    order.push([p2, p3, p4].find((id) => !order.includes(id))!)

    for (const playerId of order) {
      const playerName = (await db.players.get(playerId))!.name
      fireEvent.click(screen.getByRole('button', { name: playerName }))
    }

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar partida' }))
    await screen.findByText('Rodadas')

    const match = (await db.matches.toArray())[0]
    expect(match.serveOrder).toEqual(order)
    // Consecutive servers must be on opposite teams (Section 4).
    for (let i = 1; i < match.serveOrder.length; i++) {
      expect(teamOf(match.serveOrder[i])).not.toBe(teamOf(match.serveOrder[i - 1]))
    }
  })
})
