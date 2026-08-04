// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../../App'
import { db, DEFAULT_PLAYER_NAMES } from '../../db/db'

afterEach(cleanup)

/**
 * End-to-end smoke test for the Phase 2 flow, run against a real Dexie
 * database backed by fake-indexeddb (no actual browser available in this
 * environment). Exercises: seeding, disponibilidade -> formato/rotação
 * (balanceado) -> criação do torneio -> lista de rodadas -> configuração de
 * partida (sorteio) -> persistência -> retomada após "reload".
 */
describe('Phase 2 flow (availability -> rotation -> match setup), persisted to Dexie', () => {
  it('walks the full wizard and persists a tournament + a configured match', async () => {
    render(<App />)

    // Fresh install: nothing to resume, so App lands on Home first.
    fireEvent.click(await screen.findByRole('button', { name: 'Torneio' }))
    await screen.findByText('Quem joga hoje?')

    for (const playerName of DEFAULT_PLAYER_NAMES) {
      // usePlayers() resolves its Dexie liveQuery asynchronously, after the
      // heading above has already rendered — wait for each checkbox rather
      // than assuming the list is populated as soon as the screen mounts.
      fireEvent.click(await screen.findByLabelText(playerName))
    }

    fireEvent.click(screen.getByRole('button', { name: /Continuar \(5 jogadores\)/ }))

    await screen.findByText('Formato e rotação')
    expect(screen.getByRole('button', { name: 'Duplas (Americano)' })).toHaveClass('bg-lime')
    expect(screen.getByRole('button', { name: 'Balanceado (recomendado)' })).toHaveClass('bg-lime')
    // Canonical 5-player schedule (Section 2) has exactly 5 rounds.
    expect(screen.getAllByText(/^Rodada \d$/)).toHaveLength(5)

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e criar torneio' }))

    await screen.findByText('Rodadas')
    expect(screen.getAllByText(/^Rodada \d$/)).toHaveLength(5)
    expect(screen.getAllByText('Pendente')).toHaveLength(5)

    const tournamentsAfterCreate = await db.tournaments.toArray()
    expect(tournamentsAfterCreate).toHaveLength(1)
    expect(tournamentsAfterCreate[0].rounds).toHaveLength(5)

    fireEvent.click(screen.getAllByRole('button', { name: 'Configurar partida' })[0])

    await screen.findByText(/Configurar partida — Rodada 1/)
    // "Sortear" (random serve order) is the default mode and is already valid.
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar partida' }))

    await screen.findByText('Rodadas')
    expect(screen.getAllByText('Configurada')).toHaveLength(1)
    expect(screen.getAllByText('Pendente')).toHaveLength(4)
    expect(screen.getByText(/Ordem de saque:/)).toBeTruthy()

    const matches = await db.matches.toArray()
    expect(matches).toHaveLength(1)
    expect(matches[0].serveOrder).toHaveLength(4)
    expect(matches[0].status).toBe('scheduled')

    const settings = await db.appSettings.get('settings')
    expect(settings?.currentTournamentId).toBe(tournamentsAfterCreate[0].id)
  })

  it('resumes the in-progress tournament on a fresh mount instead of restarting the wizard', async () => {
    // A second render() simulates a full app reload: App reads
    // AppSettings.currentTournamentId on mount and should skip Home and the
    // availability screen, landing straight on the rounds list.
    render(<App />)

    await screen.findByText('Rodadas')
    expect(screen.queryByText('Quem joga hoje?')).toBeNull()
    expect(screen.getAllByText('Configurada')).toHaveLength(1)
    expect(screen.getAllByText('Pendente')).toHaveLength(4)
  })
})
