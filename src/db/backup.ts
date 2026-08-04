import { db } from './db'
import type { MatchRow, PlayerRow, TournamentRow } from './db'

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
 * Merge-import: union by id (a UUID for every player/tournament/match),
 * skipping any record whose id already exists locally. Never overwrites
 * existing data, so importing the same backup twice — or backups from
 * multiple phones that share some history — never duplicates or clobbers
 * anything.
 */
export async function mergeImport(payload: BackupPayload): Promise<MergeResult> {
  const result: MergeResult = {
    players: { added: 0, skipped: 0 },
    tournaments: { added: 0, skipped: 0 },
    matches: { added: 0, skipped: 0 },
  }

  await db.transaction('rw', db.players, db.tournaments, db.matches, async () => {
    for (const player of payload.players) {
      if (await db.players.get(player.id)) result.players.skipped++
      else {
        await db.players.add(player)
        result.players.added++
      }
    }
    for (const tournament of payload.tournaments) {
      if (await db.tournaments.get(tournament.id)) result.tournaments.skipped++
      else {
        await db.tournaments.add(tournament)
        result.tournaments.added++
      }
    }
    for (const match of payload.matches) {
      if (await db.matches.get(match.id)) result.matches.skipped++
      else {
        await db.matches.add(match)
        result.matches.added++
      }
    }
  })

  return result
}
