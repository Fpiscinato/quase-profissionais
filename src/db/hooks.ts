import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { PlayerId } from '../engine/types'
import type { PlayerRow, TournamentRow } from './db'

export function usePlayers(): { players: PlayerRow[]; byId: Map<PlayerId, PlayerRow> } {
  const all = useLiveQuery(() => db.players.toArray(), [], [])
  const players = all.filter((p) => p.active)
  const byId = new Map(all.map((p) => [p.id, p]))
  return { players, byId }
}

export function useSettings() {
  return useLiveQuery(() => db.appSettings.get('settings'), [])
}

export function useTournament(tournamentId: string | undefined): TournamentRow | undefined {
  return useLiveQuery(
    () => (tournamentId ? db.tournaments.get(tournamentId) : undefined),
    [tournamentId],
  )
}
