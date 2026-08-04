import Dexie, { type EntityTable } from 'dexie'
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

/** Seeds the 5 default players only if the table is empty (first run). */
export async function ensurePlayersSeeded(): Promise<void> {
  const count = await db.players.count()
  if (count === 0) await seedDefaultPlayers()
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
}

export async function createTournament(input: CreateTournamentInput): Promise<TournamentRow> {
  const tournament: TournamentRow = {
    id: newId(),
    date: new Date().toISOString().slice(0, 10),
    availablePlayerIds: input.availablePlayerIds,
    format: input.format,
    teamFormationMode: input.teamFormationMode,
    options: DEFAULT_MATCH_CONFIG,
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
