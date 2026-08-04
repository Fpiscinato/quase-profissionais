// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../../App'
import { db, ensurePlayersSeeded } from '../../db/db'

afterEach(cleanup)

async function createTournamentViaWizard() {
  // Each test starts from a clean slate — the three tests in this file
  // otherwise accumulate tournaments/matches in the shared fake-indexeddb.
  await db.matches.clear()
  await db.tournaments.clear()
  await db.appSettings.clear()

  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: 'Torneio' }))
  await screen.findByText('Quem joga hoje?')

  const players = await db.players.toArray()
  for (const p of players.slice(0, 4)) {
    fireEvent.click(await screen.findByLabelText(p.name))
  }
  fireEvent.click(screen.getByRole('button', { name: /Continuar \(4 jogadores\)/ }))
  await screen.findByText('Formato e rotação')
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar e criar torneio' }))
  await screen.findByText('Rodadas')
}

describe('Tournament lifecycle — finishing/deleting unblocks starting a new one (reported bug)', () => {
  it('"Encerrar torneio" stops the app from resuming the old tournament forever', async () => {
    await ensurePlayersSeeded()
    await createTournamentViaWizard()
    const firstTournamentId = (await db.tournaments.toArray())[0].id

    // Before the fix: nothing ever set status='completed', so App always
    // resumed straight back into this same tournament — no way out.
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar torneio' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Encerrar e começar novo' }))

    // Back on Home, not stuck.
    await screen.findByRole('button', { name: 'Torneio' })
    expect((await db.tournaments.get(firstTournamentId))!.status).toBe('completed')
    expect((await db.appSettings.get('settings'))?.currentTournamentId).toBeUndefined()

    // A fresh app mount must NOT resume the finished tournament...
    cleanup()
    render(<App />)
    await screen.findByRole('button', { name: 'Torneio' }) // Home, not "Rodadas"
    expect(screen.queryByText('Rodadas')).toBeNull()

    // ...and starting a new tournament from scratch must work.
    fireEvent.click(screen.getByRole('button', { name: 'Torneio' }))
    await screen.findByText('Quem joga hoje?')
  })

  it('"Excluir torneio" removes it (and its matches) entirely and unblocks a new one', async () => {
    await ensurePlayersSeeded()
    await createTournamentViaWizard()
    const tournamentId = (await db.tournaments.toArray())[0].id

    fireEvent.click(screen.getByRole('button', { name: 'Excluir torneio' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sim, excluir tudo' }))

    await screen.findByRole('button', { name: 'Torneio' }) // back on Home
    expect(await db.tournaments.get(tournamentId)).toBeUndefined()
    expect(await db.matches.where('tournamentId').equals(tournamentId).count()).toBe(0)
    expect((await db.appSettings.get('settings'))?.currentTournamentId).toBeUndefined()

    fireEvent.click(screen.getByRole('button', { name: 'Torneio' }))
    await screen.findByText('Quem joga hoje?')
  })

  it('deleting a not-yet-started configured match clears the round so it can be redone', async () => {
    await ensurePlayersSeeded()
    await createTournamentViaWizard()

    fireEvent.click(screen.getAllByRole('button', { name: 'Configurar partida' })[0])
    await screen.findByText(/Configurar partida — Rodada 1/)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar partida' }))
    await screen.findByText('Rodadas')
    expect(screen.getAllByText('Configurada')[0]).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar exclusão' }))

    await screen.findAllByRole('button', { name: 'Configurar partida' })
    const tournament = (await db.tournaments.toArray())[0]
    expect(tournament.rounds[0].matchId).toBeUndefined()
    expect(await db.matches.count()).toBe(0)
  })
})
