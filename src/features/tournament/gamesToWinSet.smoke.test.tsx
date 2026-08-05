// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../../App'
import { db, DEFAULT_PLAYER_NAMES } from '../../db/db'

afterEach(cleanup)

describe('Games-to-win-set is configurable at tournament creation (2 to 6)', () => {
  it('defaults to 4, and picking 2 persists options.gamesToWinSet = 2', async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Torneio' }))
    await screen.findByText('Quem joga hoje?')
    for (const p of DEFAULT_PLAYER_NAMES) {
      fireEvent.click(await screen.findByLabelText(p))
    }
    fireEvent.click(screen.getByRole('button', { name: /Continuar \(5 jogadores\)/ }))
    await screen.findByText('Formato e rotação')

    // Default is 4 games.
    expect(screen.getByRole('button', { name: '4' })).toHaveClass('border-lime')

    fireEvent.click(screen.getByRole('button', { name: '2' }))
    expect(screen.getByRole('button', { name: '2' })).toHaveClass('border-lime')
    expect(screen.getByRole('button', { name: '4' })).not.toHaveClass('border-lime')

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e criar torneio' }))
    await screen.findByText('Rodadas')

    const tournament = (await db.tournaments.toArray())[0]
    expect(tournament.options.gamesToWinSet).toBe(2)
  })
})
