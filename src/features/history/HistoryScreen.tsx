import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db/db'
import { usePlayers } from '../../db/hooks'
import type { PlayerId } from '../../engine/types'
import { formatDate, formatDuration } from '../../lib/format'
import { card } from '../../ui/styles'

export function HistoryScreen() {
  const tournaments = useLiveQuery(
    () => db.tournaments.orderBy('createdAt').reverse().toArray(),
    [],
    [],
  )
  const matches = useLiveQuery(() => db.matches.toArray(), [], [])
  const { byId } = usePlayers()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'
  const teamName = (ids: PlayerId[]) => ids.map(name).join(' & ')

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (tournaments.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">Histórico</h1>
        <p className="mt-2 text-sm text-cream/70">Nenhum torneio registrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Histórico</h1>

      <div className="flex flex-col gap-2">
        {tournaments.map((tournament) => {
          const tournamentMatches = matches
            .filter((m) => m.tournamentId === tournament.id && m.status === 'completed')
            .sort((a, b) => a.roundIndex - b.roundIndex)
          const isOpen = expanded.has(tournament.id)

          return (
            <div key={tournament.id} className={card}>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => toggle(tournament.id)}
              >
                <div>
                  <div className="font-semibold">{formatDate(tournament.date)}</div>
                  <div className="text-xs text-cream/60">
                    {tournament.format === 'duplas' ? 'Duplas (Americano)' : 'Individual'} ·{' '}
                    {tournamentMatches.length}/{tournament.rounds.length} partida
                    {tournament.rounds.length > 1 ? 's' : ''} concluída
                    {tournamentMatches.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className="text-cream/50">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="mt-3 flex flex-col gap-2 border-t border-cream/10 pt-3">
                  {tournamentMatches.length === 0 && (
                    <p className="text-sm text-cream/60">Nenhuma partida concluída.</p>
                  )}
                  {tournamentMatches.map((match) => (
                    <div key={match.id} className="rounded-lg bg-navy px-3 py-2 text-sm">
                      <div className="text-xs text-cream/60">Rodada {match.roundIndex + 1}</div>
                      <div>
                        <span className={match.winnerTeam === 'team1' ? 'font-bold text-lime' : ''}>
                          {teamName(match.team1)}
                        </span>{' '}
                        {match.games1} × {match.games2}{' '}
                        <span className={match.winnerTeam === 'team2' ? 'font-bold text-lime' : ''}>
                          {teamName(match.team2)}
                        </span>
                      </div>
                      <div className="text-xs text-cream/60">
                        Pontos: {match.points1} – {match.points2} · Duração:{' '}
                        {formatDuration(match.durationSeconds ?? 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
