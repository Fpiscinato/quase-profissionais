// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../../App'
import { db, ensurePlayersSeeded } from '../../db/db'
import type { BackupPayload } from '../../db/backup'
import { DEFAULT_MATCH_CONFIG } from '../../engine/types'

afterEach(cleanup)

describe('Backup merge-import — union by UUID, skip duplicates (Phase 4)', () => {
  it('adds only genuinely new records and never overwrites an existing id, even with different data', async () => {
    // "Phone A": local data already on this device.
    await ensurePlayersSeeded()
    const localPlayers = await db.players.toArray()
    const jaredeId = localPlayers.find((p) => p.name === 'Jarede')!.id
    const mateusId = localPlayers.find((p) => p.name === 'Mateus')!.id

    const localTournamentId = crypto.randomUUID()
    await db.tournaments.add({
      id: localTournamentId,
      date: '2026-08-01',
      availablePlayerIds: [jaredeId, mateusId],
      format: 'individual',
      teamFormationMode: 'balanced',
      options: DEFAULT_MATCH_CONFIG,
      rounds: [{ index: 0, team1: [jaredeId], team2: [mateusId], restingPlayerIds: [] }],
      status: 'in_progress',
      createdAt: Date.now(),
    })
    const localMatchId = crypto.randomUUID()
    await db.matches.add({
      id: localMatchId,
      tournamentId: localTournamentId,
      roundIndex: 0,
      team1: [jaredeId],
      team2: [mateusId],
      serveOrder: [jaredeId, mateusId],
      pointLog: [],
      games1: 4,
      games2: 2,
      points1: 20,
      points2: 15,
      winnerTeam: 'team1',
      status: 'completed',
    })

    // "Phone B": a backup that has drifted — it re-exported the SAME Jarede,
    // tournament and match ids but with different (stale/conflicting) data,
    // plus one genuinely new player/tournament/match of its own.
    const newPlayerId = crypto.randomUUID()
    const newTournamentId = crypto.randomUUID()
    const newMatchId = crypto.randomUUID()

    const incoming: BackupPayload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      players: [
        { id: jaredeId, name: 'Jarede (versão do celular B)', active: true },
        { id: newPlayerId, name: 'Convidado', active: true },
      ],
      tournaments: [
        {
          id: localTournamentId,
          date: '1999-01-01', // conflicting data for the same id
          availablePlayerIds: [jaredeId, mateusId],
          format: 'individual',
          teamFormationMode: 'balanced',
          options: DEFAULT_MATCH_CONFIG,
          rounds: [],
          status: 'completed',
          createdAt: 0,
        },
        {
          id: newTournamentId,
          date: '2026-08-04',
          availablePlayerIds: [jaredeId, newPlayerId],
          format: 'individual',
          teamFormationMode: 'balanced',
          options: DEFAULT_MATCH_CONFIG,
          rounds: [{ index: 0, team1: [jaredeId], team2: [newPlayerId], restingPlayerIds: [] }],
          status: 'in_progress',
          createdAt: Date.now(),
        },
      ],
      matches: [
        {
          id: localMatchId,
          tournamentId: localTournamentId,
          roundIndex: 0,
          team1: [jaredeId],
          team2: [mateusId],
          serveOrder: [jaredeId, mateusId],
          pointLog: [],
          games1: 0, // conflicting data for the same id
          games2: 4,
          points1: 1,
          points2: 20,
          winnerTeam: 'team2',
          status: 'completed',
        },
        {
          id: newMatchId,
          tournamentId: newTournamentId,
          roundIndex: 0,
          team1: [jaredeId],
          team2: [newPlayerId],
          serveOrder: [jaredeId, newPlayerId],
          pointLog: [],
          games1: 4,
          games2: 0,
          points1: 16,
          points2: 5,
          winnerTeam: 'team1',
          status: 'completed',
        },
      ],
    }

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Backup' }))
    await screen.findByText('Importar')

    const file = new File([JSON.stringify(incoming)], 'backup.json', { type: 'application/json' })
    const input = screen.getByTestId('import-file-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await screen.findByText('Importação concluída:')
    expect(screen.getByText(/Jogadores: 1 adicionados, 1 já existiam/)).toBeInTheDocument()
    expect(screen.getByText(/Torneios: 1 adicionados, 1 já existiam/)).toBeInTheDocument()
    expect(screen.getByText(/Partidas: 1 adicionadas, 1 já existiam/)).toBeInTheDocument()

    // The existing records were NOT overwritten by the conflicting incoming data.
    expect((await db.players.get(jaredeId))!.name).toBe('Jarede')
    expect((await db.tournaments.get(localTournamentId))!.date).toBe('2026-08-01')
    expect((await db.tournaments.get(localTournamentId))!.status).toBe('in_progress')
    const localMatch = await db.matches.get(localMatchId)
    expect(localMatch!.games1).toBe(4)
    expect(localMatch!.games2).toBe(2)
    expect(localMatch!.winnerTeam).toBe('team1')

    // The genuinely new records were added.
    expect((await db.players.get(newPlayerId))?.name).toBe('Convidado')
    expect(await db.tournaments.get(newTournamentId)).toBeDefined()
    expect(await db.matches.get(newMatchId)).toBeDefined()

    // Nothing was duplicated: 5 seeded + 1 new = 6 players; 1 + 1 = 2 of the rest.
    expect(await db.players.count()).toBe(6)
    expect(await db.tournaments.count()).toBe(2)
    expect(await db.matches.count()).toBe(2)

    // Importing the exact same file again is a full no-op (everything now exists).
    const file2 = new File([JSON.stringify(incoming)], 'backup2.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file2] } })
    await screen.findByText(/Jogadores: 0 adicionados, 2 já existiam/)
    expect(await db.players.count()).toBe(6)
  })

  it('reconciles default players by name instead of duplicating them when ids differ across installs', async () => {
    // Default players get a fresh crypto.randomUUID() every time
    // seedDefaultPlayers runs (first launch of each install/reinstall), so a
    // backup from another phone — or an old backup restored after a reset —
    // carries the SAME 5 names under DIFFERENT ids. Reproduce that here: the
    // incoming "Jarede" has a brand-new id, not the local one.
    // Clear state left over from the previous test in this file (fake-indexeddb persists across `it` blocks).
    await db.players.clear()
    await db.tournaments.clear()
    await db.matches.clear()
    await ensurePlayersSeeded()
    const localPlayers = await db.players.toArray()
    const localJaredeId = localPlayers.find((p) => p.name === 'Jarede')!.id
    const localMateusId = localPlayers.find((p) => p.name === 'Mateus')!.id
    expect(await db.players.count()).toBe(5)

    const foreignJaredeId = crypto.randomUUID()
    const foreignMateusId = crypto.randomUUID()
    const foreignTournamentId = crypto.randomUUID()
    const foreignMatchId = crypto.randomUUID()

    const incoming: BackupPayload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      players: [
        // Same 5 default names, different ids — as if seeded on another phone.
        { id: foreignJaredeId, name: 'Jarede', active: true },
        { id: foreignMateusId, name: ' mateus ', active: true }, // whitespace/case drift too
      ],
      tournaments: [
        {
          id: foreignTournamentId,
          date: '2026-08-05',
          availablePlayerIds: [foreignJaredeId, foreignMateusId],
          format: 'individual',
          teamFormationMode: 'balanced',
          options: DEFAULT_MATCH_CONFIG,
          rounds: [
            {
              index: 0,
              team1: [foreignJaredeId],
              team2: [foreignMateusId],
              restingPlayerIds: [],
            },
          ],
          status: 'completed',
          createdAt: Date.now(),
        },
      ],
      matches: [
        {
          id: foreignMatchId,
          tournamentId: foreignTournamentId,
          roundIndex: 0,
          team1: [foreignJaredeId],
          team2: [foreignMateusId],
          serveOrder: [foreignJaredeId, foreignMateusId],
          pointLog: [],
          games1: 4,
          games2: 1,
          points1: 20,
          points2: 10,
          winnerTeam: 'team1',
          status: 'completed',
        },
      ],
    }

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Backup' }))
    await screen.findByText('Importar')

    const file = new File([JSON.stringify(incoming)], 'backup.json', { type: 'application/json' })
    const input = screen.getByTestId('import-file-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await screen.findByText('Importação concluída:')
    // Both incoming players matched an existing local player by name — none added.
    expect(screen.getByText(/Jogadores: 0 adicionados, 2 já existiam/)).toBeInTheDocument()
    expect(await db.players.count()).toBe(5) // still just the 5 seeded — no duplicates

    // The imported tournament/match still reference the LOCAL ids, not the
    // foreign ones, so history/ranking resolve to the existing player rows.
    const importedTournament = await db.tournaments.get(foreignTournamentId)
    expect(importedTournament!.availablePlayerIds).toEqual([localJaredeId, localMateusId])
    expect(importedTournament!.rounds[0].team1).toEqual([localJaredeId])
    expect(importedTournament!.rounds[0].team2).toEqual([localMateusId])

    const importedMatch = await db.matches.get(foreignMatchId)
    expect(importedMatch!.team1).toEqual([localJaredeId])
    expect(importedMatch!.team2).toEqual([localMateusId])
    expect(importedMatch!.serveOrder).toEqual([localJaredeId, localMateusId])
  })

  it('rejects a file that is not a valid backup payload', async () => {
    await ensurePlayersSeeded()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Backup' }))
    await screen.findByText('Importar')

    const badFile = new File(['{"not":"a backup"}'], 'oops.json', { type: 'application/json' })
    const input = screen.getByTestId('import-file-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [badFile] } })

    await screen.findByText(/não parece um backup válido/)
  })
})

describe('Backup — export sharing', () => {
  afterEach(() => {
    // Cleanup of the test-only stubs added below (jsdom has no Web Share API by default).
    delete (navigator as { share?: unknown }).share
    delete (navigator as { canShare?: unknown }).canShare
  })

  it('falls back to a plain download when the Web Share API is unavailable', async () => {
    await ensurePlayersSeeded()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Backup' }))
    await screen.findByText('Exportar')

    // No share-folder hint when the platform can't share files.
    expect(screen.queryByText(/Salvar no Drive/)).not.toBeInTheDocument()

    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: 'Exportar dados' }))
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled())
    expect(revokeObjectURL).toHaveBeenCalled()
    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
  })

  it('shares the backup file when the Web Share API supports files', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    navigator.share = share
    navigator.canShare = () => true

    await ensurePlayersSeeded()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Backup' }))
    await screen.findByText(/Salvar no Drive/)

    fireEvent.click(screen.getByRole('button', { name: 'Exportar dados' }))
    await waitFor(() => expect(share).toHaveBeenCalled())
    const call = share.mock.calls[0][0]
    expect(call.files).toHaveLength(1)
    expect(call.files[0].name).toMatch(/^qp-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/)
  })
})
