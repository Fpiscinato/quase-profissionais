// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within, waitFor, cleanup } from '@testing-library/react'
import App from '../../App'
import { db, DEFAULT_PLAYER_NAMES } from '../../db/db'

afterEach(cleanup)

describe('Players CRUD (Jogadores screen)', () => {
  it('adds a player, blocks duplicate names, edits, and hard-deletes a player with no matches', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Jogadores' }))
    await screen.findByText('Adicione, edite ou remova jogadores do grupo.')

    for (const n of DEFAULT_PLAYER_NAMES) {
      await screen.findByText(n)
    }

    const nameInput = screen.getByPlaceholderText('Nome do novo jogador')

    // Add a new player.
    fireEvent.change(nameInput, { target: { value: 'Teste' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
    await screen.findByText('Teste')
    expect(await db.players.toArray()).toHaveLength(6)

    // Duplicate name (case-insensitive, extra whitespace) is blocked — no 7th player created.
    fireEvent.change(nameInput, { target: { value: '  teste  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
    await screen.findByText('Já existe um jogador chamado "teste".')
    expect(await db.players.toArray()).toHaveLength(6)

    // Edit "Teste" -> "Testando".
    const testeId = (await db.players.toArray()).find((p) => p.name === 'Teste')!.id
    const testeRow = screen.getByTestId(`player-row-${testeId}`)
    fireEvent.click(within(testeRow).getByRole('button', { name: 'Editar' }))
    const editInput = within(testeRow).getByDisplayValue('Teste')
    fireEvent.change(editInput, { target: { value: 'Testando' } })
    fireEvent.click(within(testeRow).getByRole('button', { name: 'Salvar' }))
    await screen.findByText('Testando')
    expect(screen.queryByText('Teste')).toBeNull()

    // Renaming to an existing name is blocked (case-insensitive) and the name is unchanged.
    fireEvent.click(within(testeRow).getByRole('button', { name: 'Editar' }))
    fireEvent.change(within(testeRow).getByDisplayValue('Testando'), {
      target: { value: 'fernando' },
    })
    fireEvent.click(within(testeRow).getByRole('button', { name: 'Salvar' }))
    await screen.findByText('Já existe um jogador chamado "fernando".')
    expect((await db.players.get(testeId))!.name).toBe('Testando')
    fireEvent.click(within(testeRow).getByRole('button', { name: 'Cancelar' }))

    // Delete "Testando": no matches reference it, so it's hard-deleted (row disappears entirely).
    fireEvent.click(within(testeRow).getByRole('button', { name: 'Excluir' }))
    fireEvent.click(within(testeRow).getByRole('button', { name: 'Sim, remover' }))
    // removePlayer() is async (Dexie/IndexedDB), so the row's disappearance
    // happens a tick or two after the click — poll instead of a single flush.
    await waitFor(() => expect(screen.queryByTestId(`player-row-${testeId}`)).toBeNull())
    expect(await db.players.get(testeId)).toBeUndefined()
    expect(await db.players.toArray()).toHaveLength(5)
  })

  it('archives (not hard-deletes) a player who already has a recorded match', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Jogadores' }))
    await screen.findByText('Adicione, edite ou remova jogadores do grupo.')
    const jarede = (await db.players.toArray()).find((p) => p.name === 'Jarede')!

    await db.matches.add({
      id: 'seed-match-1',
      tournamentId: 'seed-tournament-1',
      roundIndex: 0,
      team1: [jarede.id],
      team2: ['some-other-player-id'],
      serveOrder: [jarede.id, 'some-other-player-id'],
      pointLog: [],
      games1: 0,
      games2: 0,
      points1: 0,
      points2: 0,
      status: 'scheduled',
    })

    const jaredeRow = screen.getByTestId(`player-row-${jarede.id}`)
    fireEvent.click(within(jaredeRow).getByRole('button', { name: 'Excluir' }))
    fireEvent.click(within(jaredeRow).getByRole('button', { name: 'Sim, remover' }))

    await screen.findByText('Arquivado')
    expect((await db.players.get(jarede.id))!.active).toBe(false)
    // Archived, not deleted: the row (and match history) is still there.
    expect(await db.players.get(jarede.id)).toBeDefined()
    expect(await db.players.toArray()).toHaveLength(5)

    // An archived player can no longer be marked available for a new tournament.
    fireEvent.click(screen.getByRole('button', { name: '‹ Início' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Torneio' }))
    await screen.findByText('Quem joga hoje?')
    expect(screen.queryByLabelText('Jarede')).toBeNull()
    expect(await screen.findByLabelText('Mateus')).toBeTruthy()
  })

  it('rejects a player name longer than 16 characters', async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Jogadores' }))
    await screen.findByText('Adicione, edite ou remova jogadores do grupo.')

    const nameInput = screen.getByPlaceholderText('Nome do novo jogador') as HTMLInputElement
    expect(nameInput.maxLength).toBe(16)

    // fireEvent.change sets .value directly, bypassing the HTML maxlength
    // clamp (that only applies to real typing/paste) — so this actually
    // exercises addPlayer()'s own length check, not just the input attribute.
    const tooLong = 'Um nome bem longo demais aqui'
    expect(tooLong.length).toBeGreaterThan(16)
    fireEvent.change(nameInput, { target: { value: tooLong } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    await screen.findByText('O nome pode ter no máximo 16 caracteres.')
    expect(await db.players.toArray()).toHaveLength(5)
  })
})
