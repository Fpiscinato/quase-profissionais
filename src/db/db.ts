import Dexie, { type EntityTable } from 'dexie'
import { applyPoint, computeMatchState } from '../engine/score'
import type { CourtSide } from '../engine/serve'
import { DEFAULT_MATCH_CONFIG } from '../engine/types'
import type { MatchConfig, PlayerId, PointLog, Team, TeamSide } from '../engine/types'

/** The 5 players every fresh install (and every full reset) must seed (Section 1). */
export const DEFAULT_PLAYER_NAMES = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson', 'Fernando']

export interface PlayerRow {
  id: string
  name: string
  active: boolean
}

export type TournamentFormat = 'duplas' | 'individual'
export type TeamFormationMode = 'balanced' | 'manual'
export type TournamentStatus = 'setup' | 'in_progress' | 'completed'

export interface RoundRecord {
  index: number
  team1: Team
  team2: Team
  restingPlayerIds: PlayerId[]
  /** Set once "Configurar partida" has been completed for this round. */
  matchId?: string
}

export interface TournamentRow {
  id: string
  date: string // ISO date (yyyy-mm-dd)
  availablePlayerIds: PlayerId[]
  format: TournamentFormat
  teamFormationMode: TeamFormationMode
  options: MatchConfig
  rounds: RoundRecord[]
  status: TournamentStatus
  createdAt: number
}

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed'

export interface MatchRow {
  id: string
  tournamentId: string
  roundIndex: number
  team1: Team
  team2: Team
  serveOrder: PlayerId[]
  /** Physical side of the court Team 1 starts the set on; Team 2 starts on the opposite side. Absent on matches created before this feature — treat as 'Direita'. */
  team1InitialSide?: CourtSide
  pointLog: PointLog
  games1: number
  games2: number
  points1: number
  points2: number
  winnerTeam?: TeamSide
  status: MatchStatus
  startedAt?: number
  completedAt?: number
  durationSeconds?: number
}

export interface AppSettingsRow {
  id: 'settings'
  schemaVersion: number
  currentTournamentId?: string
  currentMatchId?: string
  /** UI language, device-local. Defaults to 'pt' when absent. */
  lang?: 'pt' | 'en'
  /** Hands-free voice mode: speaks score/serve announcements. Defaults to off. */
  voiceMode?: boolean
  /** SpeechSynthesis playback rate for voice announcements. Defaults to 1.5 (tested well on-court). */
  voiceRate?: number
  /**
   * Independent from voiceMode: gates STT listening for "Ponto Time 1/2" commands.
   * Defaults to off — on-court testing found it unreliable (mic distance, screen-off
   * cancelling the recognition session), so it's an explicit opt-in on top of voiceMode.
   */
  voiceCommandsEnabled?: boolean
  /** KeyboardEvent.code per action id (see features/keys/actions.ts) for a physical remote/clicker. */
  keyBindings?: Record<string, string>
  /** Device-local layout preference for the live match screen. 'auto' picks by viewport width. */
  layoutMode?: 'auto' | 'tablet' | 'smartphone'
}

const db = new Dexie('quase-profissionais') as Dexie & {
  players: EntityTable<PlayerRow, 'id'>
  tournaments: EntityTable<TournamentRow, 'id'>
  matches: EntityTable<MatchRow, 'id'>
  appSettings: EntityTable<AppSettingsRow, 'id'>
}

db.version(1).stores({
  players: 'id',
  tournaments: 'id, status, createdAt',
  matches: 'id, tournamentId, status',
  appSettings: 'id',
})

export { db }

function newId(): string {
  return crypto.randomUUID()
}

/** Wipes players and seeds exactly the 5 defaults. Used on first run and on full reset. */
export async function seedDefaultPlayers(): Promise<void> {
  await db.players.clear()
  await db.players.bulkAdd(
    DEFAULT_PLAYER_NAMES.map((name) => ({ id: newId(), name, active: true })),
  )
}

/**
 * Seeds the 5 default players only if the table is empty (first run).
 * Wrapped in a transaction so the check-then-seed isn't racy: React
 * StrictMode double-invokes mount effects in dev (and two tabs opened at
 * once could do the same in prod), so two concurrent callers both seeing an
 * empty table must not both seed — the transaction serializes them, and the
 * second sees the first's rows and no-ops.
 */
export async function ensurePlayersSeeded(): Promise<void> {
  await db.transaction('rw', db.players, async () => {
    const count = await db.players.count()
    if (count === 0) await seedDefaultPlayers()
  })
}

export async function getSettings(): Promise<AppSettingsRow> {
  const existing = await db.appSettings.get('settings')
  if (existing) return existing
  const fresh: AppSettingsRow = { id: 'settings', schemaVersion: 1 }
  await db.appSettings.put(fresh)
  return fresh
}

export async function updateSettings(patch: Partial<Omit<AppSettingsRow, 'id'>>): Promise<void> {
  const current = await getSettings()
  await db.appSettings.put({ ...current, ...patch })
}

export interface CreateTournamentInput {
  availablePlayerIds: PlayerId[]
  format: TournamentFormat
  teamFormationMode: TeamFormationMode
  rounds: Array<{ team1: Team; team2: Team; restingPlayerIds: PlayerId[] }>
  /** Defaults to DEFAULT_MATCH_CONFIG (4 games) when not given. */
  options?: MatchConfig
}

export async function createTournament(input: CreateTournamentInput): Promise<TournamentRow> {
  const tournament: TournamentRow = {
    id: newId(),
    date: new Date().toISOString().slice(0, 10),
    availablePlayerIds: input.availablePlayerIds,
    format: input.format,
    teamFormationMode: input.teamFormationMode,
    options: input.options ?? DEFAULT_MATCH_CONFIG,
    rounds: input.rounds.map((r, index) => ({ ...r, index })),
    status: 'in_progress',
    createdAt: Date.now(),
  }
  await db.tournaments.add(tournament)
  await updateSettings({ currentTournamentId: tournament.id, currentMatchId: undefined })
  return tournament
}

export interface CreateMatchInput {
  tournamentId: string
  roundIndex: number
  team1: Team
  team2: Team
  serveOrder: PlayerId[]
  /** Physical side of the court Team 1 starts on. Defaults to 'Direita'. */
  team1InitialSide?: CourtSide
}

/** Creates the Match row for a round's "Configurar partida" step and links it back to the round. */
export async function createMatchForRound(input: CreateMatchInput): Promise<MatchRow> {
  const match: MatchRow = {
    id: newId(),
    tournamentId: input.tournamentId,
    roundIndex: input.roundIndex,
    team1: input.team1,
    team2: input.team2,
    serveOrder: input.serveOrder,
    team1InitialSide: input.team1InitialSide ?? 'Esquerda',
    pointLog: [],
    games1: 0,
    games2: 0,
    points1: 0,
    points2: 0,
    status: 'scheduled',
  }
  await db.matches.add(match)

  const tournament = await db.tournaments.get(input.tournamentId)
  if (tournament) {
    const rounds = tournament.rounds.map((r) =>
      r.index === input.roundIndex ? { ...r, matchId: match.id } : r,
    )
    await db.tournaments.update(input.tournamentId, { rounds })
  }

  return match
}

export class DuplicatePlayerNameError extends Error {
  /** Raw player name, so callers can rebuild a translated message from the "{name}" template. */
  playerName: string
  constructor(name: string) {
    super(`Já existe um jogador chamado "${name}".`)
    this.name = 'DuplicatePlayerNameError'
    this.playerName = name
  }
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

async function assertNameAvailable(name: string, excludingId?: string): Promise<void> {
  const target = normalizeName(name)
  const existing = await db.players.toArray()
  const clash = existing.some((p) => p.id !== excludingId && normalizeName(p.name) === target)
  if (clash) throw new DuplicatePlayerNameError(name.trim())
}

export async function addPlayer(name: string): Promise<PlayerRow> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('O nome não pode ser vazio.')
  await assertNameAvailable(trimmed)
  const player: PlayerRow = { id: newId(), name: trimmed, active: true }
  await db.players.add(player)
  return player
}

export async function updatePlayerName(id: PlayerId, name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('O nome não pode ser vazio.')
  await assertNameAvailable(trimmed, id)
  await db.players.update(id, { name: trimmed })
}

/** True if the player is referenced by any recorded match (Section 6: history is kept per match). */
export async function playerHasMatches(playerId: PlayerId): Promise<boolean> {
  const matches = await db.matches.toArray()
  return matches.some((m) => m.team1.includes(playerId) || m.team2.includes(playerId))
}

/**
 * Removes a player. A player with match history is archived (active: false)
 * instead of hard-deleted, so past results/rankings keep working. A player
 * with no matches yet is deleted outright.
 */
export async function removePlayer(id: PlayerId): Promise<'archived' | 'deleted'> {
  if (await playerHasMatches(id)) {
    await db.players.update(id, { active: false })
    return 'archived'
  }
  await db.players.delete(id)
  return 'deleted'
}

function tallyPoints(pointLog: PointLog): { points1: number; points2: number } {
  let points1 = 0
  let points2 = 0
  for (const point of pointLog) {
    if (point === 'team1') points1++
    else points2++
  }
  return { points1, points2 }
}

/** Derives the games/points/winner snapshot stored on the row from a point log. */
function deriveMatchTally(pointLog: PointLog, config: MatchConfig) {
  const state = computeMatchState(pointLog, config)
  const { points1, points2 } = tallyPoints(pointLog)
  return {
    pointLog,
    games1: state.finalGames1 ?? state.games1,
    games2: state.finalGames2 ?? state.games2,
    points1,
    points2,
    winnerTeam: state.winner,
  }
}

/** Opens a match for live play: marks it in_progress, starts the timer once, and remembers it for resume-after-reload. */
export async function startMatch(matchId: string): Promise<void> {
  await db.transaction('rw', db.matches, async () => {
    const match = await db.matches.get(matchId)
    if (!match) throw new Error('Match not found')
    if (match.status === 'scheduled') {
      await db.matches.update(matchId, { status: 'in_progress', startedAt: Date.now() })
    }
  })
  await updateSettings({ currentMatchId: matchId })
}

/**
 * Records one point for a side. No-ops (via applyPoint) if the set is
 * already decided. Wrapped in a transaction so rapid back-to-back taps
 * (read match -> compute -> write) can't race and drop a point.
 */
export async function recordPoint(
  matchId: string,
  winner: TeamSide,
  config: MatchConfig,
): Promise<void> {
  await db.transaction('rw', db.matches, async () => {
    const match = await db.matches.get(matchId)
    if (!match) throw new Error('Match not found')
    const newLog = applyPoint(match.pointLog, winner, config)
    if (newLog === match.pointLog) return
    await db.matches.update(matchId, deriveMatchTally(newLog, config))
  })
}

/** Removes the last recorded point and recomputes games/points/winner from the shorter log. */
export async function undoLastPoint(matchId: string, config: MatchConfig): Promise<void> {
  await db.transaction('rw', db.matches, async () => {
    const match = await db.matches.get(matchId)
    if (!match || match.pointLog.length === 0) return
    const newLog = match.pointLog.slice(0, -1)
    await db.matches.update(matchId, deriveMatchTally(newLog, config))
  })
}

/** Locks in the final result: stops the timer and marks the match completed. */
export async function saveMatch(matchId: string): Promise<void> {
  await db.transaction('rw', db.matches, async () => {
    const match = await db.matches.get(matchId)
    if (!match) throw new Error('Match not found')
    const completedAt = Date.now()
    const durationSeconds = match.startedAt
      ? Math.max(0, Math.round((completedAt - match.startedAt) / 1000))
      : 0
    await db.matches.update(matchId, { status: 'completed', completedAt, durationSeconds })
  })
  await updateSettings({ currentMatchId: undefined })
}

/**
 * Marks a tournament finished so the wizard stops resuming it and offers a
 * fresh availability screen instead. Matches already played keep their
 * history — this does not delete anything.
 */
export async function finishTournament(tournamentId: string): Promise<void> {
  await db.tournaments.update(tournamentId, { status: 'completed' })
  const settings = await getSettings()
  if (settings.currentTournamentId === tournamentId) {
    await updateSettings({ currentTournamentId: undefined, currentMatchId: undefined })
  }
}

/** Deletes a tournament and every match that belongs to it. Cannot be undone. */
export async function deleteTournament(tournamentId: string): Promise<void> {
  await db.transaction('rw', db.tournaments, db.matches, async () => {
    await db.matches.where('tournamentId').equals(tournamentId).delete()
    await db.tournaments.delete(tournamentId)
  })
  const settings = await getSettings()
  if (settings.currentTournamentId === tournamentId) {
    await updateSettings({ currentTournamentId: undefined, currentMatchId: undefined })
  }
}

/**
 * Deletes every tournament (and its matches) recorded on a given date —
 * "Partida avulsa" means a single day can have several tournament rows
 * (the main one plus any one-off matches), so deleting "the day" is its own
 * operation, not the same as deleting a single tournament. Cannot be undone.
 */
export async function deleteDay(date: string): Promise<void> {
  // 'date' isn't an indexed field (the tournaments table is small enough
  // that a full scan here is fine) — filter in JS instead of db.where().
  const allTournaments = await db.tournaments.toArray()
  const dayTournamentIds = new Set(allTournaments.filter((t) => t.date === date).map((t) => t.id))
  await db.transaction('rw', db.tournaments, db.matches, async () => {
    for (const tournamentId of dayTournamentIds) {
      await db.matches.where('tournamentId').equals(tournamentId).delete()
      await db.tournaments.delete(tournamentId)
    }
  })
  const settings = await getSettings()
  if (settings.currentTournamentId && dayTournamentIds.has(settings.currentTournamentId)) {
    await updateSettings({ currentTournamentId: undefined, currentMatchId: undefined })
  }
}

/**
 * Cancels a match that hasn't been saved yet (scheduled, not started; or
 * in progress with points already played) and un-links it from its round,
 * so "Configurar partida" (teams/serve order) can be redone for that round.
 * This is the escape hatch for "started by mistake" / "need to abandon this
 * one" — the live screen only otherwise offers Desfazer (undo one point at a
 * time), which doesn't help if you just want out. Refuses to cancel a match
 * that's already completed and saved — delete the tournament for that.
 */
export async function cancelMatch(matchId: string): Promise<void> {
  await db.transaction('rw', db.tournaments, db.matches, async () => {
    const match = await db.matches.get(matchId)
    if (!match) return
    if (match.status === 'completed') {
      throw new Error('Não é possível cancelar uma partida já concluída.')
    }
    const tournament = await db.tournaments.get(match.tournamentId)
    if (tournament) {
      const rounds = tournament.rounds.map((r) =>
        r.matchId === matchId ? { ...r, matchId: undefined } : r,
      )
      await db.tournaments.update(match.tournamentId, { rounds })
    }
    await db.matches.delete(matchId)
  })
  const settings = await getSettings()
  if (settings.currentMatchId === matchId) {
    await updateSettings({ currentMatchId: undefined })
  }
}

/**
 * Full reset (Section 1): wipes players, tournaments and matches, then
 * reseeds exactly the 5 default players. Device-local settings are reset
 * too (nothing left to resume).
 */
export async function fullReset(): Promise<void> {
  await db.transaction('rw', db.players, db.tournaments, db.matches, db.appSettings, async () => {
    await db.matches.clear()
    await db.tournaments.clear()
    await seedDefaultPlayers()
    await db.appSettings.put({ id: 'settings', schemaVersion: 1 })
  })
}
