// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../../App'
import { db } from '../../db/db'

afterEach(cleanup)

describe('Partida avulsa — a single match outside the full tournament flow', () => {
  it('skips disponibilidade/rotação: pick 2 players a side, land straight on Rodadas with 1 round', async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Partida avulsa' }))
    await screen.findByText('Partida avulsa')

    // Individual (1 per side) is simpler to assert on than doubles.
    fireEvent.click(screen.getByRole('button', { name: 'Individual' }))

    const jaredeButton = await screen.findByRole('button', { name: 'Jarede' })
    const mateusButton = screen.getByRole('button', { name: 'Mateus' })
    fireEvent.click(jaredeButton)
    fireEvent.click(mateusButton)
    expect(jaredeButton).toHaveTextContent('Time 1')
    expect(mateusButton).toHaveTextContent('Time 2')

    fireEvent.click(screen.getByRole('button', { name: '3' })) // games to win set

    fireEvent.click(screen.getByRole('button', { name: 'Ir para configurar partida' }))

    // Under the hood it's a real 1-round tournament: lands on Rodadas, no
    // disponibilidade/formato-rotação screens in between.
    await screen.findByText('Rodadas')
    expect(screen.getAllByText(/^Rodada \d$/)).toHaveLength(1)
    expect(screen.getByText('Pendente')).toBeInTheDocument()

    const tournaments = await db.tournaments.toArray()
    expect(tournaments).toHaveLength(1)
    expect(tournaments[0].format).toBe('individual')
    expect(tournaments[0].options.gamesToWinSet).toBe(3)
    expect(tournaments[0].rounds).toHaveLength(1)

    // Configuring and playing it counts normally: reuses the same setup/live flow.
    fireEvent.click(screen.getByRole('button', { name: 'Configurar partida' }))
    await screen.findByText(/Configurar partida — Rodada 1/)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar partida' }))
    await screen.findByText('Rodadas')
    expect(screen.getByText('Configurada')).toBeInTheDocument()

    const matches = await db.matches.toArray()
    expect(matches).toHaveLength(1)
  })

  it('cycles a player through none -> Time 1 -> Time 2 -> none, and caps each team at the format size', async () => {
    // The previous test left an in-progress tournament as "current" — clear
    // that so App lands back on Home instead of resuming into Rodadas.
    await db.appSettings.clear()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Partida avulsa' }))
    await screen.findByText('Partida avulsa')

    // Duplas is the default format (2 per team).
    const jarede = await screen.findByRole('button', { name: 'Jarede' })
    fireEvent.click(jarede) // -> Time 1
    expect(jarede).toHaveTextContent('Time 1')
    fireEvent.click(jarede) // -> Time 2 (Time 1 has room, but already there -> cycles forward)
    expect(jarede).toHaveTextContent('Time 2')
    fireEvent.click(jarede) // -> none
    expect(jarede).not.toHaveTextContent('Time 1')
    expect(jarede).not.toHaveTextContent('Time 2')

    // Fill both teams (2 + 2), a 5th player's button becomes disabled.
    for (const p of ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson']) {
      fireEvent.click(screen.getByRole('button', { name: p }))
    }
    expect(screen.getByRole('button', { name: 'Fernando' })).toBeDisabled()
  })
})
