import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { usePlayers, useTournament } from '../../db/hooks'
import type { PlayerId } from '../../engine/types'
import { MatchSetupStep } from './MatchSetupStep'
import { card, primaryButton } from '../../ui/styles'
import { useState } from 'react'

interface Props {
  tournamentId: string
  onOpenMatch: (matchId: string) => void
}

export function RoundsListStep({ tournamentId, onOpenMatch }: Props) {
  const tournament = useTournament(tournamentId)
  const { byId } = usePlayers()
  const matches = useLiveQuery(
    () => db.matches.where('tournamentId').equals(tournamentId).toArray(),
    [tournamentId],
    [],
  )
  const [configuringRound, setConfiguringRound] = useState<number | null>(null)

  if (!tournament) {
    return <div className="p-4 text-cream/70">Carregando torneio...</div>
  }

  if (configuringRound !== null) {
    const round = tournament.rounds.find((r) => r.index === configuringRound)!
    return (
      <MatchSetupStep
        tournamentId={tournamentId}
        round={round}
        byId={byId}
        onDone={() => setConfiguringRound(null)}
        onBack={() => setConfiguringRound(null)}
      />
    )
  }

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'
  const teamName = (ids: PlayerId[]) => ids.map(name).join(' & ')
  const matchByRound = new Map(matches.map((m) => [m.roundIndex, m]))

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">Rodadas</h1>
        <p className="text-sm text-cream/70">
          {tournament.format === 'duplas' ? 'Duplas (Americano)' : 'Individual'} ·{' '}
          {tournament.rounds.length} rodada{tournament.rounds.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {tournament.rounds.map((round) => {
          const match = matchByRound.get(round.index)
          const configured = !!round.matchId && !!match
          const completed = configured && match!.status === 'completed'

          let statusLabel = 'Pendente'
          if (completed) statusLabel = 'Concluída ✓'
          else if (configured) statusLabel = 'Configurada'

          return (
            <div key={round.index} className={card}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-cream/60">Rodada {round.index + 1}</span>
                <span
                  className={`text-xs font-semibold ${
                    configured ? 'text-lime' : 'text-cream/50'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="font-semibold">
                {teamName(round.team1)} <span className="text-cream/50">vs</span>{' '}
                {teamName(round.team2)}
              </div>
              {round.restingPlayerIds.length > 0 && (
                <div className="text-xs text-cream/60">
                  Descansa: {round.restingPlayerIds.map(name).join(', ')}
                </div>
              )}

              {!configured && (
                <button
                  type="button"
                  className={`${primaryButton} mt-3`}
                  onClick={() => setConfiguringRound(round.index)}
                >
                  Configurar partida
                </button>
              )}

              {configured && !completed && (
                <>
                  <div className="mt-2 text-xs text-cream/60">
                    Ordem de saque: {match!.serveOrder.map(name).join(', ')}
                  </div>
                  <button
                    type="button"
                    className={`${primaryButton} mt-3`}
                    onClick={() => onOpenMatch(match!.id)}
                  >
                    {match!.status === 'in_progress' ? 'Continuar partida' : 'Iniciar partida'}
                  </button>
                </>
              )}

              {completed && (
                <div className="mt-2 text-sm">
                  {teamName(match!.team1)} {match!.games1} × {match!.games2}{' '}
                  {teamName(match!.team2)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
