// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../../App'
import { db, DEFAULT_PLAYER_NAMES } from '../../db/db'

afterEach(cleanup)

describe('Phase 2 flow — fixed-pairs team formation', () => {
  it('locks in partners once and creates a single-round tournament between the two fixed pairs', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Torneio' }))
    await screen.findByText('Quem joga hoje?')

    // Only 4 of the 5 default players — fixed pairs needs an even count.
    for (const playerName of ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson']) {
      fireEvent.click(await screen.findByLabelText(playerName))
    }
    fireEvent.click(screen.getByRole('button', { name: /Continuar \(4 jogadores\)/ }))

    await screen.findByText('Formato e rotação')
    fireEvent.click(screen.getByRole('button', { name: 'Duplas fixas' }))
    await screen.findByText(/Toque em 2 jogadores pra formar uma dupla fixa/)

    const confirmButton = screen.getByRole('button', { name: 'Confirmar e criar torneio' })
    expect(confirmButton).toBeDisabled()

    // Pair Jarede & Mateus.
    fireEvent.click(screen.getByRole('button', { name: 'Jarede' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mateus' }))
    expect(confirmButton).toBeDisabled() // only 1 of 2 pairs formed so far

    // Pair Mateus Adv & Emerson.
    fireEvent.click(screen.getByRole('button', { name: 'Mateus Adv' }))
    fireEvent.click(screen.getByRole('button', { name: 'Emerson' }))
    expect(confirmButton).toBeEnabled()

    fireEvent.click(confirmButton)
    await screen.findByText('Rodadas')

    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id

    const tournament = (await db.tournaments.toArray())[0]
    expect(tournament.teamFormationMode).toBe('fixed')
    expect(tournament.rounds).toHaveLength(1)
    expect(tournament.rounds[0].team1).toEqual([byName('Jarede'), byName('Mateus')])
    expect(tournament.rounds[0].team2).toEqual([byName('Mateus Adv'), byName('Emerson')])
    expect(tournament.rounds[0].restingPlayerIds).toEqual([])
  })

  it('shows a message and keeps confirm disabled with an odd number of available players', async () => {
    // The previous test left a completed tournament behind — App would
    // otherwise auto-resume straight into "Rodadas" instead of Home.
    await db.matches.clear()
    await db.tournaments.clear()
    await db.appSettings.clear()

    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Torneio' }))
    await screen.findByText('Quem joga hoje?')

    // All 5 defaults — doubles-eligible (4+) but odd, so fixed pairs can
    // never fully pair everyone up.
    for (const playerName of DEFAULT_PLAYER_NAMES) {
      fireEvent.click(await screen.findByLabelText(playerName))
    }
    fireEvent.click(screen.getByRole('button', { name: /Continuar \(5 jogadores\)/ }))

    await screen.findByText('Formato e rotação')
    fireEvent.click(screen.getByRole('button', { name: 'Duplas fixas' }))
    await screen.findByText('Duplas fixas precisa de um número par de jogadores disponíveis.')

    // Pairing off 4 of the 5 still can't complete — one is always left over.
    fireEvent.click(screen.getByRole('button', { name: 'Jarede' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mateus' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mateus Adv' }))
    fireEvent.click(screen.getByRole('button', { name: 'Emerson' }))

    expect(screen.getByRole('button', { name: 'Confirmar e criar torneio' })).toBeDisabled()
  })
})
