// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../../App'
import { createMatchForRound, createTournament, db, ensurePlayersSeeded } from '../../db/db'
import { buildServeOrder } from '../../engine/serve'

afterEach(cleanup)

// recordPoint/undoLastPoint/saveMatch are async Dexie writes that the click
// handlers don't await, so every assertion that depends on one must wait for
// the live-queried re-render rather than reading the DOM synchronously.
const ponto1 = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Ponto — Time 1' }))
  await Promise.resolve()
}
const ponto2 = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Ponto — Time 2' }))
  await Promise.resolve()
}
const desfazer = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }))
  await Promise.resolve()
}

async function expectText(text: string) {
  await screen.findByText(text)
}
async function expectGone(text: string) {
  await waitFor(() => expect(screen.queryByText(text)).toBeNull())
}

async function seedOneRoundMatch() {
  await ensurePlayersSeeded()
  const players = await db.players.toArray()
  const byName = (n: string) => players.find((p) => p.name === n)!.id
  const [a, b, c, d, e] = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson', 'Fernando'].map(byName)

  const tournament = await createTournament({
    availablePlayerIds: [a, b, c, d, e],
    format: 'duplas',
    teamFormationMode: 'manual',
    rounds: [{ team1: [a, b], team2: [c, d], restingPlayerIds: [e] }],
  })
  const serveOrder = buildServeOrder([a, b], [c, d]) // [a, c, b, d]
  const match = await createMatchForRound({
    tournamentId: tournament.id,
    roundIndex: 0,
    team1: [a, b],
    team2: [c, d],
    serveOrder,
  })
  return { tournament, match }
}

async function openLiveMatch() {
  render(<App />)
  await screen.findByText('Rodadas')
  // First open: "Iniciar partida" (status scheduled). Resuming later in the
  // same match: "Continuar partida" (status in_progress) — accept either.
  fireEvent.click(screen.getByRole('button', { name: /Iniciar partida|Continuar partida/ }))
  await screen.findByText(/Saca agora:/)
}

describe('Live match screen (Phase 3), driven by the Phase-1 engine', () => {
  it('shows live score/server/side, reacts to points, and undo (single + repeated) recomputes everything', async () => {
    const { match } = await seedOneRoundMatch()
    await openLiveMatch()

    // Game 1 serves from serveOrder[0] = Jarede (team1), point 1 always Direita.
    await expectText('Saca agora: Jarede — Direita')
    await expectText('0 – 0')

    await ponto1()
    await expectText('15 – 0')
    await expectText('Saca agora: Jarede — Esquerda')

    await ponto1()
    await ponto1()
    await expectText('40 – 0')
    // 3 points completed (odd) -> Esquerda.
    await expectText('Saca agora: Jarede — Esquerda')

    await ponto1() // closes game 1, 4-0
    await expectText('Game!')
    await expectText('Troquem de lado') // 1 total game = odd
    await expectText('Games: 1 – 0')
    // Next server is serveOrder[1] = Mateus Adv (team2), fresh game -> Direita.
    await expectText('Saca agora: Mateus Adv — Direita')

    // Undo the game-winning point: back to 40-0, game 1 still open, server back to Jarede/Esquerda.
    await desfazer()
    await expectText('40 – 0')
    await expectText('Games: 0 – 0')
    await expectText('Saca agora: Jarede — Esquerda')
    await expectGone('Game!')

    await ponto1() // re-close game 1 (4-0)
    await expectText('Games: 1 – 0')
    await ponto2()
    await ponto2() // game 2 now at 0-2 for team2

    // Undo twice in a row: step back past the point of the "mistake" (both game-2 points).
    await desfazer()
    await desfazer()
    await expectText('Games: 1 – 0')
    await expectText('0 – 0') // back to a fresh game 2, no points yet

    // Persisted correctly: reload mid-match resumes straight into the live screen, not the rounds list.
    cleanup()
    render(<App />)
    await screen.findByText(/Saca agora:/)
    expect(screen.queryByText('Quem joga hoje?')).toBeNull()
    expect(screen.queryByText('Rodadas')).toBeNull()
    await expectText('Games: 1 – 0')

    const persisted = await db.matches.get(match.id)
    expect(persisted?.status).toBe('in_progress')
    expect(persisted?.startedAt).toBeTypeOf('number')
  })

  it('plays through a tiebreak to match point, reviews the result, and locks it on save', async () => {
    // Continues the match left at "Games: 1 – 0" (team1 up one game) from the
    // previous test. It's still in_progress, so a fresh mount resumes
    // straight into the live screen — there's no rounds list to click through.
    render(<App />)
    await screen.findByText(/Saca agora:/)
    await expectText('Games: 1 – 0')

    const winGame = async (side: 'team1' | 'team2') => {
      for (let i = 0; i < 4; i++) await (side === 'team1' ? ponto1() : ponto2())
    }

    // Alternate winners to march the set to 4-4 without ever deciding it outright.
    await winGame('team2') // 1-1
    await winGame('team1') // 2-1
    await winGame('team2') // 2-2
    await winGame('team1') // 3-2
    await winGame('team2') // 3-3
    await winGame('team1') // 4-3
    await winGame('team2') // 4-4 -> tiebreak

    await expectText('Games: 4 – 4')
    await expectText('Tiebreak!')
    await expectText('Tiebreak')
    await expectText('0 – 0') // tiebreak points display

    // Play the tiebreak: team2 wins it 7-0 -> final set recorded 4-5.
    for (let i = 0; i < 6; i++) await ponto2()
    await expectText('0 – 6')
    expect(screen.queryByText('Set encerrado')).toBeNull()

    await ponto2() // 7th tiebreak point -> match over

    await expectText('Set encerrado')
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Ponto — Time 1' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Ponto — Time 2' })).toBeNull()
    })
    await expectText('Resultado final')
    expect(screen.getByText(/4 × 5/)).toBeInTheDocument()

    // Desfazer must still work post-decision, to fix a mistaken final tap.
    await desfazer()
    await expectGone('Set encerrado')
    await screen.findByRole('button', { name: 'Ponto — Time 2' })
    await ponto2() // redo it
    await expectText('Set encerrado')

    fireEvent.click(screen.getByRole('button', { name: 'Salvar partida' }))

    await screen.findByText('Rodadas')
    await expectText('Concluída ✓')
    expect(screen.getByText(/4 × 5/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar partida' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Continuar partida' })).toBeNull()

    const matches = await db.matches.toArray()
    expect(matches).toHaveLength(1)
    expect(matches[0].status).toBe('completed')
    expect(matches[0].games1).toBe(4)
    expect(matches[0].games2).toBe(5)
    expect(matches[0].winnerTeam).toBe('team2')
    expect(matches[0].durationSeconds).toBeTypeOf('number')
    expect(matches[0].completedAt).toBeTypeOf('number')

    const settings = await db.appSettings.get('settings')
    expect(settings?.currentMatchId).toBeUndefined()

    // A reload after saving must NOT jump back into the (now locked) live match screen.
    cleanup()
    render(<App />)
    await screen.findByText('Rodadas')
    await expectText('Concluída ✓')
  })
})
