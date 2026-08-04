// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
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
