import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { usePlayers, useTournament } from '../../db/hooks'
import type { PlayerId } from '../../engine/types'
import { MatchSetupStep } from './MatchSetupStep'
import { card, primaryButton } from '../../ui/styles'
import { useState } from 'react'

interface Props {
  tournamentId: string
}

export function RoundsListStep({ tournamentId }: Props) {
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
          return (
            <div key={round.index} className={card}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-cream/60">Rodada {round.index + 1}</span>
                <span
                  className={`text-xs font-semibold ${configured ? 'text-lime' : 'text-cream/50'}`}
                >
                  {configured ? 'Configurada ✓' : 'Pendente'}
                </span>
              </div>
              <div className="font-semibold">
                {round.team1.map(name).join(' & ')} <span className="text-cream/50">vs</span>{' '}
                {round.team2.map(name).join(' & ')}
              </div>
              {round.restingPlayerIds.length > 0 && (
                <div className="text-xs text-cream/60">
                  Descansa: {round.restingPlayerIds.map(name).join(', ')}
                </div>
              )}
              {configured && match ? (
                <div className="mt-2 text-xs text-cream/60">
                  Ordem de saque: {match.serveOrder.map(name).join(', ')}
                </div>
              ) : (
                <button
                  type="button"
                  className={`${primaryButton} mt-3`}
                  onClick={() => setConfiguringRound(round.index)}
                >
                  Configurar partida
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
