import Dexie, { type EntityTable } from 'dexie'
import { applyPoint, computeMatchState } from '../engine/score'
import type { CourtSide } from '../engine/serve'
import { DEFAULT_MATCH_CONFIG } from '../engine/types'
import type { MatchConfig, PlayerId, PointLog, SetResult, Team, TeamSide } from '../engine/types'

/**
 * Fills in any MatchConfig fields missing from a stored TournamentRow.options —
 * tournaments created before a config field existed (e.g. setsToWinMatch,
 * superTiebreakPoints) have an `options` object that predates it, so at
 * runtime that field reads as undefined despite MatchConfig typing it as
 * required. Same "absent field = legacy default" pattern already used for
 * MatchRow.team1InitialSide/TournamentRow.origin, just applied to the whole
 * config object at once.
 */
export function resolveMatchConfig(options: MatchConfig): MatchConfig {
  return { ...DEFAULT_MATCH_CONFIG, ...options }
}

/** The 5 players every fresh install (and every full reset) must seed (Section 1). */
export const DEFAULT_PLAYER_NAMES = ['Jarede', 'Mateus', 'Mateus Adv', 'Emerson', 'Fernando']

export interface PlayerRow {
  id: string
  name: string
  active: boolean
  /** Short (3-letter) tag shown on space-constrained displays (ex.: relógio). Optional, not unique. */
  nickname?: string
}

export type TournamentFormat = 'duplas' | 'individual'
export type TeamFormationMode = 'balanced' | 'manual'
export type TournamentStatus = 'setup' | 'in_progress' | 'completed'
export type TournamentOrigin = 'torneio' | 'avulsa'

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
  /**
   * 'torneio' (full wizard) vs 'avulsa' (Praticar, a single quick match) —
   * lets Ranking/History optionally exclude practice matches. Absent on
   * rows created before this field existed; always treat that as 'torneio'
   * (keeps old behavior unchanged when the filter is off, and errs toward
   * still counting old data when it's on rather than silently dropping it).
   */
  origin?: TournamentOrigin
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
  /** One flat, continuous log for the whole match (every set) — see PointLog. */
  pointLog: PointLog
  /** Completed sets, in order played. Absent/empty on matches created before multi-set support — treat as a single implicit set won by winnerTeam. */
  sets?: SetResult[]
  /** Sets won by each side. Absent on matches created before multi-set support — treat as 1/0 or 0/1 from winnerTeam. */
  sets1?: number
  sets2?: number
  /** Total games across every set (was: the single set's games, before multi-set support — identical value for a single-set match). */
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
  /**
   * Whoever is physically holding the remote/clicker (see features/keys/*) —
   * "Configurar partida" pre-selects this player (if they're in the round)
   * and, if set, swaps team1/team2 on match creation so their team always
   * lands on remoteHolderFixedTeam. Absent means no one configured yet.
   */
  remoteHolderPlayerId?: PlayerId
  /** Which side remoteHolderPlayerId's team is always swapped to occupy. Defaults to 'team1' when a holder is set but this is absent. */
  remoteHolderFixedTeam?: TeamSide
  /**
   * 6-digit pairing code for the Wear OS watch remote (see features/watch/) —
   * shared across matches for the day/tournament once paired, not re-asked
   * per match. Absent means no watch paired.
   */
  watchRoomPin?: string
  /** Whether the watch screen dims itself after idle, vs. staying always on. Defaults to false (always on) when absent. */
  watchAutoDim?: boolean
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

// v2.0 added TournamentRow.origin ('torneio' | 'avulsa') to distinguish real
// tournaments from Praticar (quick) matches. Existing rows predate the
// field — backfill using the one reliable structural signal available:
// Praticar always creates exactly 1 round (see QuickMatchScreen.tsx), while
// a real multi-player Torneio's balanced rotation across rounds is the
// whole point of that flow. Not airtight (e.g. a 2-player Individual
// tournament is also 1 round), but the user explicitly asked to just
// assume it for existing data rather than requiring manual re-tagging.
db.version(2)
  .stores({
    players: 'id',
    tournaments: 'id, status, createdAt',
    matches: 'id, tournamentId, status',
    appSettings: 'id',
  })
  .upgrade(async (tx) => {
    await tx
      .table('tournaments')
      .toCollection()
      .modify((tournament: TournamentRow) => {
        if (tournament.origin === undefined) {
          tournament.origin = tournament.rounds.length === 1 ? 'avulsa' : 'torneio'
        }
      })
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
  origin: TournamentOrigin
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
    origin: input.origin,
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
    sets: [],
    sets1: 0,
    sets2: 0,
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

/**
 * Keeps names short enough to fit the sticky ranking column, team-card
 * labels, etc. without wrapping. Kept fairly tight (not just "generous")
 * because a Duplas display combines TWO names ("A & B") — the live match
 * screen in particular was extensively tuned to never need scrolling on a
 * small phone, and a long combined pair name could blow that budget even
 * with the defensive truncation added there.
 */
export const MAX_PLAYER_NAME_LENGTH = 16

/** Nickname shown on the relógio (Wear OS) remote — small screen, so kept to 3 letters. */
export const MAX_NICKNAME_LENGTH = 4

async function assertNameAvailable(name: string, excludingId?: string): Promise<void> {
  const target = normalizeName(name)
  const existing = await db.players.toArray()
  const clash = existing.some((p) => p.id !== excludingId && normalizeName(p.name) === target)
  if (clash) throw new DuplicatePlayerNameError(name.trim())
}

function normalizeNickname(nickname: string): string | undefined {
  const trimmed = nickname.trim().toUpperCase()
  if (!trimmed) return undefined
  if (trimmed.length > MAX_NICKNAME_LENGTH) {
    throw new Error(`O apelido pode ter no máximo ${MAX_NICKNAME_LENGTH} letras.`)
  }
  return trimmed
}

export async function addPlayer(name: string, nickname?: string): Promise<PlayerRow> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('O nome não pode ser vazio.')
  if (trimmed.length > MAX_PLAYER_NAME_LENGTH) {
    throw new Error(`O nome pode ter no máximo ${MAX_PLAYER_NAME_LENGTH} caracteres.`)
  }
  await assertNameAvailable(trimmed)
  const player: PlayerRow = { id: newId(), name: trimmed, active: true }
  const normalizedNickname = nickname !== undefined ? normalizeNickname(nickname) : undefined
  if (normalizedNickname) player.nickname = normalizedNickname
  await db.players.add(player)
  return player
}

export async function updatePlayerName(id: PlayerId, name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('O nome não pode ser vazio.')
  if (trimmed.length > MAX_PLAYER_NAME_LENGTH) {
    throw new Error(`O nome pode ter no máximo ${MAX_PLAYER_NAME_LENGTH} caracteres.`)
  }
  await assertNameAvailable(trimmed, id)
  await db.players.update(id, { name: trimmed })
}

export async function updatePlayerNickname(id: PlayerId, nickname: string): Promise<void> {
  const normalized = normalizeNickname(nickname)
  await db.players.update(id, { nickname: normalized })
}

/** Compact tag for space-constrained displays — the set nickname, or the name's first letters. */
export function playerTag(player: PlayerRow): string {
  return player.nickname ?? player.name.slice(0, MAX_NICKNAME_LENGTH).toUpperCase()
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

/**
 * Merges two player records that turned out to be the same real person
 * (e.g. added twice under slightly different names, like "Mateus Adv" vs
 * "MateusAdventista") into one. Every match/tournament reference to
 * `mergeId` is repointed to `keepId` — so history/ranking count all of that
 * person's games as a single player — and the now-redundant `mergeId` row
 * is deleted outright (never archived: it has no history of its own left
 * once the merge is done). Cannot be undone.
 */
export async function mergePlayers(keepId: PlayerId, mergeId: PlayerId): Promise<void> {
  if (keepId === mergeId) throw new Error('Selecione dois jogadores diferentes para mesclar.')

  await db.transaction('rw', db.players, db.tournaments, db.matches, async () => {
    const keep = await db.players.get(keepId)
    const merge = await db.players.get(mergeId)
    if (!keep || !merge) throw new Error('Jogador não encontrado.')

    // If they ever faced each other, remapping would put the same id on
    // both sides of that match (a player "against himself") — a real data
    // integrity problem, not a normal duplicate-registration case. Refuse
    // rather than silently corrupting that match.
    const allMatches = await db.matches.toArray()
    const facedEachOther = allMatches.some(
      (m) =>
        (m.team1.includes(keepId) && m.team2.includes(mergeId)) ||
        (m.team1.includes(mergeId) && m.team2.includes(keepId)),
    )
    if (facedEachOther) {
      throw new Error(
        'Esses jogadores já se enfrentaram em uma partida um contra o outro — não é possível mesclar automaticamente.',
      )
    }

    const remap = (ids: PlayerId[]) =>
      Array.from(new Set(ids.map((id) => (id === mergeId ? keepId : id))))

    await db.matches.toCollection().modify((m: MatchRow) => {
      m.team1 = remap(m.team1)
      m.team2 = remap(m.team2)
      m.serveOrder = remap(m.serveOrder)
    })

    await db.tournaments.toCollection().modify((tour: TournamentRow) => {
      tour.availablePlayerIds = remap(tour.availablePlayerIds)
      tour.rounds = tour.rounds.map((r) => ({
        ...r,
        team1: remap(r.team1),
        team2: remap(r.team2),
        restingPlayerIds: remap(r.restingPlayerIds),
      }))
    })

    await db.players.delete(mergeId)
  })
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

/** Derives the sets/games/points/winner snapshot stored on the row from a point log. */
function deriveMatchTally(pointLog: PointLog, config: MatchConfig) {
  const state = computeMatchState(pointLog, config)
  const { points1, points2 } = tallyPoints(pointLog)
  // games1/games2 are the total across every completed set (a single-set
  // match — the default — has exactly one completedSets entry, so this is
  // unchanged from before multi-set support). The in-progress set (if any)
  // doesn't count yet, matching the old "only counted once the set/match is
  // decided" behavior.
  const games1 = state.completedSets.reduce((sum, s) => sum + s.games1, 0)
  const games2 = state.completedSets.reduce((sum, s) => sum + s.games2, 0)
  return {
    pointLog,
    sets: state.completedSets,
    sets1: state.sets1,
    sets2: state.sets2,
    games1,
    games2,
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

/** Manual correction for the origin backfill heuristic (or any future misclassification) — lets History re-tag a tournament as Torneio/Praticar by hand. */
export async function setTournamentOrigin(
  tournamentId: string,
  origin: TournamentOrigin,
): Promise<void> {
  await db.tournaments.update(tournamentId, { origin })
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
