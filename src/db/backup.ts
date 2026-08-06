import { db, normalizeName } from './db'
import type { MatchRow, PlayerRow, TournamentRow } from './db'
import type { PlayerId } from '../engine/types'

export const BACKUP_SCHEMA_VERSION = 1

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  players: PlayerRow[]
  tournaments: TournamentRow[]
  matches: MatchRow[]
}

/** Full data export (players/tournaments/matches). AppSettings is device-local runtime state, not backed up. */
export async function exportBackup(): Promise<BackupPayload> {
  const [players, tournaments, matches] = await Promise.all([
    db.players.toArray(),
    db.tournaments.toArray(),
    db.matches.toArray(),
  ])
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    players,
    tournaments,
    matches,
  }
}

export function isBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return Array.isArray(v.players) && Array.isArray(v.tournaments) && Array.isArray(v.matches)
}

export interface MergeCounts {
  added: number
  skipped: number
}

export interface MergeResult {
  players: MergeCounts
  tournaments: MergeCounts
  matches: MergeCounts
}

/**
 * Merge-import: union by id, skipping any tournament/match whose id already
 * exists locally. Never overwrites existing data, so importing the same
 * backup twice — or backups from multiple phones that share some history —
 * never clobbers anything.
 *
 * Players are reconciled by name, not just id: the 5 default players get a
 * fresh random UUID every time seedDefaultPlayers runs (first launch of each
 * install), so two phones — or a reinstall importing an old backup — end up
 * with the same names under different ids. Deduping only by id would import
 * a second "Jarede", "Mateus", etc. every time. Instead, any incoming player
 * whose (trimmed, case-insensitive) name matches a local player is treated
 * as that local player: it's skipped, and every reference to its incoming id
 * in imported tournaments/matches is remapped to the local id so history
 * still resolves to the right person.
 */
export async function mergeImport(payload: BackupPayload): Promise<MergeResult> {
  const result: MergeResult = {
    players: { added: 0, skipped: 0 },
    tournaments: { added: 0, skipped: 0 },
    matches: { added: 0, skipped: 0 },
  }

  await db.transaction('rw', db.players, db.tournaments, db.matches, async () => {
    const localPlayers = await db.players.toArray()
    const localByName = new Map(localPlayers.map((p) => [normalizeName(p.name), p]))
    const localIds = new Set(localPlayers.map((p) => p.id))

    // Every incoming player id maps to the id it should be referenced by
    // locally: itself if genuinely new, or the matching local player's id.
    const idRemap = new Map<PlayerId, PlayerId>()

    for (const player of payload.players) {
      if (localIds.has(player.id)) {
        idRemap.set(player.id, player.id)
        result.players.skipped++
        continue
      }
      const existingByName = localByName.get(normalizeName(player.name))
      if (existingByName) {
        idRemap.set(player.id, existingByName.id)
        result.players.skipped++
        continue
      }
      await db.players.add(player)
      idRemap.set(player.id, player.id)
      localByName.set(normalizeName(player.name), player)
      localIds.add(player.id)
      result.players.added++
    }

    const remapIds = (ids: PlayerId[]) => ids.map((id) => idRemap.get(id) ?? id)

    for (const tournament of payload.tournaments) {
      if (await db.tournaments.get(tournament.id)) {
        result.tournaments.skipped++
        continue
      }
      await db.tournaments.add({
        ...tournament,
        availablePlayerIds: remapIds(tournament.availablePlayerIds),
        rounds: tournament.rounds.map((r) => ({
          ...r,
          team1: remapIds(r.team1),
          team2: remapIds(r.team2),
          restingPlayerIds: remapIds(r.restingPlayerIds),
        })),
      })
      result.tournaments.added++
    }
    for (const match of payload.matches) {
      if (await db.matches.get(match.id)) {
        result.matches.skipped++
        continue
      }
      await db.matches.add({
        ...match,
        team1: remapIds(match.team1),
        team2: remapIds(match.team2),
        serveOrder: remapIds(match.serveOrder),
      })
      result.matches.added++
    }
  })

  return result
}
