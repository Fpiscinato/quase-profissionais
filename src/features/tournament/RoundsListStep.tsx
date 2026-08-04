import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, deleteScheduledMatch, deleteTournament, finishTournament } from '../../db/db'
import { usePlayers, useTournament } from '../../db/hooks'
import type { PlayerId } from '../../engine/types'
import { MatchSetupStep } from './MatchSetupStep'
import { card, destructiveButton, primaryButton, secondaryButton } from '../../ui/styles'

interface Props {
  tournamentId: string
  onOpenMatch: (matchId: string) => void
  onExit: () => void
}

type Confirm = { kind: 'finish' } | { kind: 'delete-tournament' } | { kind: 'delete-match'; matchId: string }

export function RoundsListStep({ tournamentId, onOpenMatch, onExit }: Props) {
  const tournament = useTournament(tournamentId)
  const { byId } = usePlayers()
  const matches = useLiveQuery(
    () => db.matches.where('tournamentId').equals(tournamentId).toArray(),
    [tournamentId],
    [],
  )
  const [configuringRound, setConfiguringRound] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [busy, setBusy] = useState(false)

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

  const handleFinish = async () => {
    setBusy(true)
    await finishTournament(tournamentId)
    onExit()
  }

  const handleDeleteTournament = async () => {
    setBusy(true)
    await deleteTournament(tournamentId)
    onExit()
  }

  const handleDeleteMatch = async (matchId: string) => {
    setBusy(true)
    await deleteScheduledMatch(matchId)
    setConfirm(null)
    setBusy(false)
  }

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
          const notStartedYet = configured && match!.status === 'scheduled'

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
                  Descansa:{' '}
                  {round.restingPlayerIds
                    .map(name)
                    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
                    .join(', ')}
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
                  {notStartedYet && confirm?.kind === 'delete-match' && confirm.matchId === match!.id ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <p className="text-xs text-destructive">
                        ⚠ Excluir esta configuração de partida (times e ordem de saque)? Você
                        vai precisar configurar de novo. Isso não pode ser desfeito.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={secondaryButton}
                          onClick={() => setConfirm(null)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className={`${destructiveButton} flex-1`}
                          disabled={busy}
                          onClick={() => handleDeleteMatch(match!.id)}
                        >
                          Confirmar exclusão
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className={primaryButton}
                        onClick={() => onOpenMatch(match!.id)}
                      >
                        {match!.status === 'in_progress' ? 'Continuar partida' : 'Iniciar partida'}
                      </button>
                      {notStartedYet && (
                        <button
                          type="button"
                          className={secondaryButton}
                          onClick={() => setConfirm({ kind: 'delete-match', matchId: match!.id })}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  )}
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

      <div className={card}>
        {confirm?.kind === 'finish' ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              Encerrar este torneio? As partidas já jogadas continuam no histórico e no ranking.
              Você poderá começar um torneio novo em seguida.
            </p>
            <div className="flex gap-2">
              <button type="button" className={secondaryButton} onClick={() => setConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className={`${primaryButton} flex-1`}
                disabled={busy}
                onClick={handleFinish}
              >
                Encerrar e começar novo
              </button>
            </div>
          </div>
        ) : confirm?.kind === 'delete-tournament' ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-destructive">
              ⚠ Excluir este torneio inteiro, com todas as suas partidas? Essa ação não pode ser
              desfeita.
            </p>
            <div className="flex gap-2">
              <button type="button" className={secondaryButton} onClick={() => setConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className={`${destructiveButton} flex-1`}
                disabled={busy}
                onClick={handleDeleteTournament}
              >
                Sim, excluir tudo
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              className={`${secondaryButton} flex-1`}
              onClick={() => setConfirm({ kind: 'finish' })}
            >
              Encerrar torneio
            </button>
            <button
              type="button"
              className={destructiveButton}
              onClick={() => setConfirm({ kind: 'delete-tournament' })}
            >
              Excluir torneio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
