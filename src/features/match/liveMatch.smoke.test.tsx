// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react'
import App from '../../App'
import { createMatchForRound, createTournament, db, ensurePlayersSeeded } from '../../db/db'
import { buildServeOrder } from '../../engine/serve'
import { DEFAULT_MATCH_CONFIG } from '../../engine/types'
import type { MatchConfig } from '../../engine/types'

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

async function expectText(text: string | RegExp) {
  await screen.findByText(text)
}
async function expectGone(text: string | RegExp) {
  await waitFor(() => expect(screen.queryByText(text)).toBeNull())
}

// The "Saca agora" banner leads with a 🎾 emoji and wraps the side in its own
// <span> (for the Direita/Esquerda color), so getByText can't match its full
// text as one string (testing-library doesn't cross element boundaries) —
// query the banner by test id and check its combined textContent instead.
function serveBanner() {
  return screen.getByTestId('serve-banner')
}
async function expectServe(playerName: string, side: 'Direita' | 'Esquerda') {
  await waitFor(() => {
    expect(serveBanner().textContent).toContain(`Saca agora: ${playerName} — ${side}`)
  })
}

async function seedOneRoundMatch(
  team1InitialSide: 'Esquerda' | 'Direita' = 'Esquerda',
  options?: Partial<MatchConfig>,
) {
  await ensurePlayersSeeded()
  const players = await db.players.toArray()
  const byName = (n: string) => players.find((p) => p.name === n)!.id
  const [a, b, c, d, e] = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson', 'Fernando'].map(byName)

  const tournament = await createTournament({
    availablePlayerIds: [a, b, c, d, e],
    format: 'duplas',
    teamFormationMode: 'manual',
    rounds: [{ team1: [a, b], team2: [c, d], restingPlayerIds: [e] }],
    options: options ? { ...DEFAULT_MATCH_CONFIG, ...options } : undefined,
    origin: 'torneio',
  })
  const serveOrder = buildServeOrder([a, b], [c, d]) // [a, c, b, d]
  const match = await createMatchForRound({
    tournamentId: tournament.id,
    roundIndex: 0,
    team1: [a, b],
    team2: [c, d],
    serveOrder,
    team1InitialSide,
  })
  return { tournament, match }
}

async function openLiveMatch() {
  render(<App />)
  await screen.findByText('Rodadas')
  // The round's matches liveQuery resolves separately from (and slightly
  // after) the "Rodadas" heading, so the round can still show "Configurar
  // partida" for a moment even though a match already exists — poll
  // (findByRole) rather than reading synchronously (getByRole).
  fireEvent.click(
    await screen.findByRole('button', { name: /Iniciar partida|Continuar partida/ }),
  )
  await screen.findByTestId('serve-banner')
}

describe('Live match screen (Phase 3), driven by the Phase-1 engine', () => {
  it('shows live score/server/side, reacts to points, and undo (single + repeated) recomputes everything', async () => {
    const { match } = await seedOneRoundMatch()
    await openLiveMatch()

    // Game 1 serves from serveOrder[0] = Jarede (team1), point 1 always Direita.
    await expectServe('Jarede', 'Direita')
    await expectText('0 – 0')

    await ponto1()
    await expectText('15 – 0')
    await expectServe('Jarede', 'Esquerda')

    await ponto1()
    await ponto1()
    await expectText('40 – 0')
    // 3 points completed (odd) -> Esquerda.
    await expectServe('Jarede', 'Esquerda')

    await ponto1() // closes game 1, 4-0
    await expectText('Game!')
    await expectText('Troquem de lado') // 1 total game = odd -> sides already flipped: team1 now Direita.
    await expectText('Games: 0 – 1')
    // Next server is serveOrder[1] = Mateus Adv (team2), fresh game -> Direita.
    await expectServe('Mateus Adv', 'Direita')

    // Undo the game-winning point: back to 40-0, game 1 still open, server back to Jarede/Esquerda.
    await desfazer()
    await expectText('40 – 0')
    await expectText('Games: 0 – 0')
    await expectServe('Jarede', 'Esquerda')
    await expectGone('Game!')

    await ponto1() // re-close game 1 (4-0) -> team1 flips to Direita again
    await expectText('Games: 0 – 1')
    await ponto2()
    await ponto2() // game 2 now at 0-2 for team2

    // Undo twice in a row: step back past the point of the "mistake" (both game-2 points).
    await desfazer()
    await desfazer()
    await expectText('Games: 0 – 1')
    await expectText('0 – 0') // back to a fresh game 2, no points yet

    // Persisted correctly: reload mid-match resumes straight into the live screen, not the rounds list.
    cleanup()
    render(<App />)
    await screen.findByTestId('serve-banner')
    expect(screen.queryByText('Quem joga hoje?')).toBeNull()
    expect(screen.queryByText('Rodadas')).toBeNull()
    await expectText('Games: 0 – 1')

    const persisted = await db.matches.get(match.id)
    expect(persisted?.status).toBe('in_progress')
    expect(persisted?.startedAt).toBeTypeOf('number')
  })

  it('plays through a tiebreak to match point, reviews the result, and locks it on save', async () => {
    // Continues the match left at "Games: 0 – 1" (team1 up one game, but on
    // the Direita/right side after the 1st change of ends) from the previous
    // test. It's still in_progress, so a fresh mount resumes straight into
    // the live screen — there's no rounds list to click through.
    render(<App />)
    await screen.findByTestId('serve-banner')
    await expectText('Games: 0 – 1')

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
    // At exactly 6 tiebreak points, sides change again (team1 -> Direita/right).
    for (let i = 0; i < 6; i++) await ponto2()
    await expectText('6 – 0')
    expect(screen.queryByText('Resultado final')).toBeNull()

    await ponto2() // 7th tiebreak point -> match over

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Ponto — Time 1' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Ponto — Time 2' })).toBeNull()
    })
    await expectText('Resultado final')
    expect(screen.getByText(/4 × 5/)).toBeInTheDocument()

    // Desfazer must still work post-decision, to fix a mistaken final tap.
    await desfazer()
    await expectGone('Resultado final')
    await screen.findByRole('button', { name: 'Ponto — Time 2' })
    await ponto2() // redo it
    await expectText('Resultado final')

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

  it('pulses "Saca agora" only when the server actually changes, and flips a mini-court for "Troquem de lado"', async () => {
    await seedOneRoundMatch()
    await openLiveMatch()

    // Fresh match, first server ever shown — nothing to compare against, no pulse.
    await expectServe('Jarede', 'Direita')
    expect(serveBanner()).not.toHaveClass('animate-serve-pulse')

    // Same server (Jarede) serves the whole game 1 — no pulse on these points.
    await ponto1()
    await expectServe('Jarede', 'Esquerda')
    expect(serveBanner()).not.toHaveClass('animate-serve-pulse')
    await ponto1()
    await expectText('30 – 0')
    expect(serveBanner()).not.toHaveClass('animate-serve-pulse')

    await ponto1()
    await ponto1() // closes game 1 (4-0) -> server changes to Mateus Adv
    await expectServe('Mateus Adv', 'Direita')

    // The pulse is set by a useEffect that fires after the banner text
    // itself commits, so there's a brief window where the text has already
    // updated but the effect hasn't run yet — wait for the class rather than
    // assuming it's there the instant the text matches.
    await waitFor(() => expect(serveBanner()).toHaveClass('animate-serve-pulse'))
    const banner = serveBanner()
    expect(banner.textContent).toContain('Mateus Adv')

    // Self-clears shortly after.
    await waitFor(
      () => expect(serveBanner()).not.toHaveClass('animate-serve-pulse'),
      { timeout: 2000 },
    )

    // "Troquem de lado" (1 total game = odd) shows the flipping mini-court alongside the label.
    await expectText('Troquem de lado')
    const changeEndsBanner = screen.getByText('Troquem de lado').closest('div')!
    expect(within(changeEndsBanner).getByText('T1')).toBeInTheDocument()
    expect(within(changeEndsBanner).getByText('T2')).toBeInTheDocument()
    expect(changeEndsBanner.querySelector('.animate-court-flip')).toBeTruthy()
  })

  it('lays out team cards/buttons by physical court side, flips them on change of ends, and shows a D/E side history', async () => {
    await seedOneRoundMatch('Esquerda')
    await openLiveMatch()

    const pointButtons = () => screen.getAllByRole('button', { name: /^Ponto —/ })
    // Team 1 started on the Esquerda (left) -> its card and button render first.
    expect(pointButtons()[0]).toHaveTextContent('Time 1')
    expect(pointButtons()[1]).toHaveTextContent('Time 2')

    const team1Card = screen.getByText('Time 1').closest('div')!.parentElement!
    const team2Card = screen.getByText('Time 2').closest('div')!.parentElement!
    expect(within(team1Card).getByLabelText('Histórico de lados: Esquerda')).toBeInTheDocument()
    expect(within(team2Card).getByLabelText('Histórico de lados: Direita')).toBeInTheDocument()

    // Close game 1 (4-0 for team1) -> 1 total game completed (odd) -> change of ends.
    await ponto1()
    await ponto1()
    await ponto1()
    await ponto1()
    await expectText('Troquem de lado')

    // Sides flip: Team 2 is now on the left, Team 1 on the right — same DOM
    // nodes (stable `key`), just reordered, so the captured refs still work.
    expect(pointButtons()[0]).toHaveTextContent('Time 2')
    expect(pointButtons()[1]).toHaveTextContent('Time 1')
    expect(
      within(team1Card).getByLabelText('Histórico de lados: Esquerda, Direita'),
    ).toBeInTheDocument()
    expect(
      within(team2Card).getByLabelText('Histórico de lados: Direita, Esquerda'),
    ).toBeInTheDocument()
  })

  it('caps the visible court-side trail at the last 5 changes on a long tiebreak, keeping the full trail in aria-label', async () => {
    await seedOneRoundMatch()
    await openLiveMatch()

    const winGame = async (side: 'team1' | 'team2') => {
      for (let i = 0; i < 4; i++) await (side === 'team1' ? ponto1() : ponto2())
    }

    // Alternate winners to 4-4 without deciding the set -> ceil(8/2) = 4 swaps -> 5-entry trail (not truncated yet).
    await winGame('team1')
    await winGame('team2')
    await winGame('team1')
    await winGame('team2')
    await winGame('team1')
    await winGame('team2')
    await winGame('team1')
    await winGame('team2')
    await expectText('Games: 4 – 4')
    await expectText('Tiebreak')

    const team1Card = screen.getByText('Time 1').closest('div')!.parentElement!
    const sideHistoryOf = (teamCard: HTMLElement) =>
      within(teamCard).getByLabelText(/^Histórico de lados:/)

    const before = sideHistoryOf(team1Card)
    expect(before.getAttribute('aria-label')!.split(', ')).toHaveLength(5)
    expect(before.querySelectorAll('.text-lime, .text-gold')).toHaveLength(5)
    expect(before.textContent).not.toContain('…')

    // 6 tiebreak points -> one more swap (floor(6/6)=1) -> 6-entry trail -> now must truncate to the last 5.
    for (let i = 0; i < 6; i++) await ponto2()
    await expectText('6 – 0') // tiebreak score, waits for the re-render the swap count depends on

    const after = sideHistoryOf(team1Card)
    const fullSides = after.getAttribute('aria-label')!.replace('Histórico de lados: ', '').split(', ')
    expect(fullSides).toHaveLength(6)
    expect(after.textContent).toContain('…')
    const visibleLetters = Array.from(after.querySelectorAll('.text-lime, .text-gold')).map(
      (el) => el.textContent,
    )
    expect(visibleLetters).toEqual(fullSides.slice(-5).map((s) => s[0]))
  })

  it('shows a fixed-size, per-team games progress row that fills as games are won, including the +1 tiebreak box', async () => {
    await seedOneRoundMatch()
    await openLiveMatch()

    // Default config: gamesToWinSet 4 -> 5 boxes per row (covers the +1 tiebreak game).
    const filledCount = (testId: string) =>
      screen.getByTestId(testId).querySelectorAll('.bg-lime, .bg-cream').length
    const totalBoxCount = (testId: string) => screen.getByTestId(testId).children.length

    expect(totalBoxCount('games-progress-team1')).toBe(5)
    expect(totalBoxCount('games-progress-team2')).toBe(5)
    expect(filledCount('games-progress-team1')).toBe(0)
    expect(filledCount('games-progress-team2')).toBe(0)

    await ponto1()
    await ponto1()
    await ponto1()
    await ponto1() // team1 wins game 1 -> Games: 0 de 4 becomes 1 filled box for team1
    await expectText('Games: 1 de 4')
    expect(filledCount('games-progress-team1')).toBe(1)
    expect(filledCount('games-progress-team2')).toBe(0)

    const winGame = async (side: 'team1' | 'team2') => {
      for (let i = 0; i < 4; i++) await (side === 'team1' ? ponto1() : ponto2())
    }
    await winGame('team2') // 1-1
    await winGame('team1') // 2-1
    await winGame('team2') // 2-2
    await winGame('team1') // 3-2
    await winGame('team2') // 3-3
    await winGame('team1') // 4-3
    await winGame('team2') // 4-4 -> tiebreak

    await expectText('Games: 4 de 4')
    expect(filledCount('games-progress-team1')).toBe(4)
    expect(filledCount('games-progress-team2')).toBe(4)
    // Still exactly 5 boxes per row at 4-4 — the row never grows mid-match.
    expect(totalBoxCount('games-progress-team1')).toBe(5)
    expect(totalBoxCount('games-progress-team2')).toBe(5)

    // Team2 wins the tiebreak -> credited a 5th ("+1") box, filling its row.
    for (let i = 0; i < 7; i++) await ponto2()
    await expectText('Resultado final')
    await expectText('Games: 5 de 4')
    expect(filledCount('games-progress-team1')).toBe(4)
    expect(filledCount('games-progress-team2')).toBe(5)
  })

  it('cancels an in-progress match: points played are discarded, the round goes back to Pendente', async () => {
    const { tournament, match } = await seedOneRoundMatch()
    await openLiveMatch()

    // Play a few points so there's real progress that cancelling must discard.
    await ponto1()
    await ponto1()
    await expectText('30 – 0')

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar partida' }))
    await expectText(/Cancelar esta partida\?/)

    // Backing out of the confirm keeps the match alive with its points intact.
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    await expectGone(/Cancelar esta partida\?/)
    await expectText('30 – 0')

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar partida' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sim, cancelar partida' }))

    await screen.findByText('Rodadas')
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Continuar partida|Iniciar partida/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Configurar partida' })).toBeInTheDocument()

    expect(await db.matches.get(match.id)).toBeUndefined()
    const persistedTournament = await db.tournaments.get(tournament.id)
    expect(persistedTournament?.rounds[0].matchId).toBeUndefined()

    const settings = await db.appSettings.get('settings')
    expect(settings?.currentMatchId).toBeUndefined()
  })

  it('plays a best-of-3 match through a tied decider (super-tiebreak) end to end', async () => {
    const { match } = await seedOneRoundMatch('Esquerda', { setsToWinMatch: 2 })
    await openLiveMatch()

    const winStraightSet = async (side: 'team1' | 'team2') => {
      for (let i = 0; i < 16; i++) await (side === 'team1' ? ponto1() : ponto2())
    }

    await expectText('Sets: 0 de 2')
    expect(screen.getByTestId('sets-progress-team1').children).toHaveLength(2)

    // Set 1: team1 wins straight 4-0 -> 1-0 in sets, banner shows, games reset.
    await winStraightSet('team1')
    await expectText('Set encerrado')
    await expectText('Sets: 1 de 2')
    await expectText('Games: 0 de 4')

    // Set 2: team2 wins straight 4-0 -> 1-1 in sets -> the 3rd set is a
    // deciding super-tiebreak, not another full set of games.
    await winStraightSet('team2')
    await expectText('Super tiebreak (set decisivo)')
    expect(screen.queryByText(/Games: \d de 4/)).toBeNull()

    // team1 closes the super-tiebreak 10-2 -> wins the match 2 sets to 1.
    for (let i = 0; i < 9; i++) await ponto1()
    for (let i = 0; i < 2; i++) await ponto2()
    await ponto1()

    await expectText('Resultado final')
    expect(screen.getByText(/2 × 1/)).toBeInTheDocument()
    expect(screen.getByText(/4-0, 0-4, 10-2\*/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar partida' }))
    await screen.findByText('Rodadas')

    const persisted = await db.matches.get(match.id)
    expect(persisted?.sets1).toBe(2)
    expect(persisted?.sets2).toBe(1)
    expect(persisted?.sets).toHaveLength(3)
    expect(persisted?.sets?.[2]).toEqual({ games1: 10, games2: 2, winner: 'team1', superTiebreak: true })
    expect(persisted?.games1).toBe(14) // 4 (set 1) + 0 (set 2) + 10 (super-tiebreak points)
    expect(persisted?.games2).toBe(6) // 0 + 4 + 2
    expect(persisted?.winnerTeam).toBe('team1')
  })
})
