// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'

const DB_NAME = 'quase-profissionais'

describe('db schema v1 -> v2 migration: origin backfill', () => {
  it('assumes 1-round tournaments were Praticar (avulsa) and multi-round ones were Torneio, without touching rows that already have origin', async () => {
    // Simulate a pre-v2.0 install: only the v1 schema exists, so every
    // tournament predates the `origin` field entirely.
    const legacyDb = new Dexie(DB_NAME)
    legacyDb.version(1).stores({
      players: 'id',
      tournaments: 'id, status, createdAt',
      matches: 'id, tournamentId, status',
      appSettings: 'id',
    })
    await legacyDb.open()
    await legacyDb.table('tournaments').bulkAdd([
      {
        id: 'avulsa-like',
        date: '2026-08-01',
        availablePlayerIds: [],
        format: 'individual',
        teamFormationMode: 'manual',
        options: {},
        rounds: [{ index: 0, team1: [], team2: [], restingPlayerIds: [] }],
        status: 'completed',
        createdAt: 1,
      },
      {
        id: 'torneio-like',
        date: '2026-08-02',
        availablePlayerIds: [],
        format: 'duplas',
        teamFormationMode: 'balanced',
        options: {},
        rounds: [
          { index: 0, team1: [], team2: [], restingPlayerIds: [] },
          { index: 1, team1: [], team2: [], restingPlayerIds: [] },
        ],
        status: 'completed',
        createdAt: 2,
      },
      {
        id: 'already-tagged',
        date: '2026-08-03',
        availablePlayerIds: [],
        format: 'individual',
        teamFormationMode: 'manual',
        options: {},
        rounds: [{ index: 0, team1: [], team2: [], restingPlayerIds: [] }],
        status: 'completed',
        createdAt: 3,
        origin: 'torneio',
      },
    ])
    legacyDb.close()

    // Import the real app db (registers v1 + v2 with the upgrade function)
    // only now — importing it up top would open a fresh v2 db before the
    // legacy v1 data above exists, skipping the migration path entirely.
    const { db } = await import('./db')
    await db.open()

    const avulsaLike = await db.tournaments.get('avulsa-like')
    const torneioLike = await db.tournaments.get('torneio-like')
    const alreadyTagged = await db.tournaments.get('already-tagged')

    expect(avulsaLike?.origin).toBe('avulsa')
    expect(torneioLike?.origin).toBe('torneio')
    expect(alreadyTagged?.origin).toBe('torneio')
  })
})
