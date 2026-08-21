// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../../App'
import { createTournament, db, ensurePlayersSeeded } from '../../db/db'

afterEach(cleanup)

/**
 * "Jogador com o controle remoto" (Configurar partida): picking a player and
 * fixing their team swaps team1/team2 on match creation so the physical
 * remote's "Ponto Time 1/2" buttons always land on their team, regardless of
 * which side the tournament rotation put them on. The choice is remembered
 * on the device (AppSettingsRow) for future matches.
 */
describe('Remote control team-fixing (MatchSetupStep), wired to Dexie', () => {
  it('swaps team1/team2 so the chosen player always lands on their fixed side, and remembers the choice', async () => {
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b, c, d] = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson'].map(byName)

    // Mateus Adv is on team2 for this round.
    await createTournament({
      availablePlayerIds: [a, b, c, d],
      format: 'duplas',
      teamFormationMode: 'manual',
      rounds: [{ team1: [a, b], team2: [c, d], restingPlayerIds: [] }],
      origin: 'torneio',
    })

    render(<App />)
    await screen.findByText('Rodadas')
    fireEvent.click(screen.getByRole('button', { name: 'Configurar partida' }))
    await screen.findByText(/Configurar partida — Rodada 1/)

    // Before picking anyone: team1/team2 shown as originally assigned (order matters here).
    expect(screen.getByText(/Time 1:/).closest('p')!.textContent).toMatch(
      /Time 1:\s*Jarede & Mateus.*Time 2:\s*Emerson & Mateus Adv/s,
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: c } }) // Mateus Adv
    await screen.findByRole('button', { name: 'Time dele: Time 1' })
    fireEvent.click(screen.getByRole('button', { name: 'Time dele: Time 1' }))

    // Mateus Adv (originally team2) is now shown under Time 1 — the display swapped.
    expect(screen.getByText(/Time 1:/).closest('p')!.textContent).toMatch(
      /Time 1:\s*Emerson & Mateus Adv.*Time 2:\s*Jarede & Mateus/s,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Time 1 na esquerda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar partida' }))
    await screen.findByText('Rodadas')

    const match = (await db.matches.toArray())[0]
    expect(match.team1).toEqual(expect.arrayContaining([c, d]))
    expect(match.team1).toHaveLength(2)
    expect(match.team2).toEqual(expect.arrayContaining([a, b]))

    const settings = await db.appSettings.get('settings')
    expect(settings?.remoteHolderPlayerId).toBe(c)
    expect(settings?.remoteHolderFixedTeam).toBe('team1')
  })

  it('pre-selects the remembered holder (when they are in the round) on a fresh match setup', async () => {
    await db.matches.clear()
    await db.tournaments.clear()
    await ensurePlayersSeeded()
    const players = await db.players.toArray()
    const byName = (n: string) => players.find((p) => p.name === n)!.id
    const [a, b, c, d] = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson'].map(byName)

    // Simulates the choice made (and remembered) in the previous test.
    await db.appSettings.put({
      id: 'settings',
      schemaVersion: 1,
      remoteHolderPlayerId: c,
      remoteHolderFixedTeam: 'team1',
    })

    // This time Mateus Adv (c) starts on team1 already — no swap should happen.
    await createTournament({
      availablePlayerIds: [a, b, c, d],
      format: 'duplas',
      teamFormationMode: 'manual',
      rounds: [{ team1: [c, d], team2: [a, b], restingPlayerIds: [] }],
      origin: 'torneio',
    })

    render(<App />)
    await screen.findByText('Rodadas')
    fireEvent.click(screen.getByRole('button', { name: 'Configurar partida' }))
    await screen.findByText(/Configurar partida — Rodada 1/)

    const select = await screen.findByRole('combobox')
    expect((select as HTMLSelectElement).value).toBe(c)
    expect(screen.getByRole('button', { name: 'Time dele: Time 1' })).toHaveClass('border-lime')
    // Already on team1 — the header must NOT show a swap.
    expect(screen.getByText(/Time 1:/).closest('p')!.textContent).toMatch(
      /Time 1:\s*Emerson & Mateus Adv.*Time 2:\s*Jarede & Mateus/s,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar partida' }))
    await screen.findByText('Rodadas')

    const match = (await db.matches.toArray())[0]
    expect(match.team1).toEqual(expect.arrayContaining([c, d]))
  })
})
