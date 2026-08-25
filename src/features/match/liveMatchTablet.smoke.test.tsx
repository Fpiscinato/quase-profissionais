// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../../App'
import {
  createMatchForRound,
  createTournament,
  db,
  ensurePlayersSeeded,
  updateSettings,
} from '../../db/db'
import { buildServeOrder } from '../../engine/serve'

afterEach(cleanup)

// jsdom has no matchMedia, so `layoutMode: 'auto'` always resolves to
// smartphone there — force 'tablet' explicitly to exercise that JSX branch.
async function seedTabletMatch() {
  await ensurePlayersSeeded()
  await updateSettings({ layoutMode: 'tablet' })
  const players = await db.players.toArray()
  const byName = (n: string) => players.find((p) => p.name === n)!.id
  const [a, b, c, d, e] = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson', 'Fernando'].map(byName)

  const tournament = await createTournament({
    availablePlayerIds: [a, b, c, d, e],
    format: 'duplas',
    teamFormationMode: 'manual',
    rounds: [{ team1: [a, b], team2: [c, d], restingPlayerIds: [e] }],
    origin: 'torneio',
  })
  const serveOrder = buildServeOrder([a, b], [c, d])
  await createMatchForRound({
    tournamentId: tournament.id,
    roundIndex: 0,
    team1: [a, b],
    team2: [c, d],
    serveOrder,
    team1InitialSide: 'Esquerda',
  })
}

describe('Live match screen in Tablet layout mode', () => {
  it('renders the same score/serve/point-button elements as smartphone mode', async () => {
    await seedTabletMatch()
    render(<App />)
    await screen.findByText('Rodadas')
    fireEvent.click(
      await screen.findByRole('button', { name: /Iniciar partida|Continuar partida/ }),
    )
    await screen.findByTestId('serve-banner')

    expect(screen.getByRole('button', { name: 'Ponto — Time 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ponto — Time 2' })).toBeInTheDocument()
    expect(screen.getByText('0 – 0')).toBeInTheDocument()
    // aria-label is the stable "Modo de layout" control name; the visible
    // text shows the current mode (mirrors the Voz/Velocidade toggle pattern).
    // Lives in the header's "Opções" panel now, not on the live match screen
    // itself — that row was crowded enough on a narrow phone to clip the
    // "Games: X de Y" label.
    fireEvent.click(screen.getByRole('button', { name: 'Opções' }))
    // LayoutToggle only mounts once the panel opens, so its own settings
    // liveQuery needs a tick to resolve — same async gap seedTabletMatch's
    // earlier update already settled for LiveMatchScreen's own instance.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Modo de layout' })).toHaveTextContent('Tablet'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ponto — Time 1' }))
    await screen.findByText('15 – 0')
  })

  it('cycles the layout pill Auto -> Tablet -> Smartphone -> Auto', async () => {
    await seedTabletMatch()
    render(<App />)
    await screen.findByText('Rodadas')
    fireEvent.click(
      await screen.findByRole('button', { name: /Iniciar partida|Continuar partida/ }),
    )
    await screen.findByTestId('serve-banner')

    fireEvent.click(screen.getByRole('button', { name: 'Opções' }))
    const toggle = () => screen.getByRole('button', { name: 'Modo de layout' })
    await waitFor(() => expect(toggle()).toHaveTextContent('Tablet'))

    fireEvent.click(toggle())
    await waitFor(() => expect(toggle()).toHaveTextContent('Smartphone'))

    fireEvent.click(toggle())
    await waitFor(() => expect(toggle()).toHaveTextContent('Automático'))
  })
})
