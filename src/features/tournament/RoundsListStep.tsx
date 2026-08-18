import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { cancelMatch, db, deleteTournament, finishTournament } from '../../db/db'
import { usePlayers, useTournament } from '../../db/hooks'
import type { PlayerId } from '../../engine/types'
import { MatchSetupStep } from './MatchSetupStep'
import { card, destructiveButton, primaryButton, secondaryButton } from '../../ui/styles'
import { useT } from '../../i18n/useT'

interface Props {
  tournamentId: string
  onOpenMatch: (matchId: string) => void
  onExit: () => void
}

type Confirm = { kind: 'finish' } | { kind: 'delete-tournament' } | { kind: 'delete-match'; matchId: string }

export function RoundsListStep({ tournamentId, onOpenMatch, onExit }: Props) {
  const { t } = useT()
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
    return <div className="p-4 text-cream/70">{t('Carregando torneio...')}</div>
  }

  if (configuringRound !== null) {
    const round = tournament.rounds.find((r) => r.index === configuringRound)!
    return (
      <MatchSetupStep
        tournamentId={tournamentId}
        round={round}
        byId={byId}
        onDone={() => setConfiguringRound(null)}
        onDoneAndStart={(matchId) => onOpenMatch(matchId)}
        onBack={() => setConfiguringRound(null)}
      />
    )
  }

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'
  const teamName = (ids: PlayerId[]) => ids.map(name).join(' & ')
  const matchByRound = new Map(matches.map((m) => [m.roundIndex, m]))

  // Finished rounds sink to the bottom so whatever still needs action
  // ("Configurar partida" / "Iniciar partida") always rises to the top —
  // no scrolling past completed rounds to find the next one to play.
  const orderedRounds = [...tournament.rounds].sort((a, b) => {
    const aDone = matchByRound.get(a.index)?.status === 'completed'
    const bDone = matchByRound.get(b.index)?.status === 'completed'
    if (aDone !== bDone) return aDone ? 1 : -1
    return a.index - b.index
  })

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
    await cancelMatch(matchId)
    setConfirm(null)
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">{t('Rodadas')}</h1>
        <p className="text-sm text-cream/70">
          {t(tournament.format === 'duplas' ? 'Duplas (Americano)' : 'Individual')} ·{' '}
          {tournament.rounds.length} {t(tournament.rounds.length > 1 ? 'rodadas' : 'rodada')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {orderedRounds.map((round) => {
          const match = matchByRound.get(round.index)
          const configured = !!round.matchId && !!match
          const completed = configured && match!.status === 'completed'
          const notStartedYet = configured && match!.status === 'scheduled'

          let statusLabel = t('Pendente')
          if (completed) statusLabel = t('Concluída ✓')
          else if (configured) statusLabel = t('Configurada')

          return (
            <div key={round.index} className={card}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-cream/60">
                  {t('Rodada')} {round.index + 1}
                </span>
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
                  {t('Descansa:')}{' '}
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
                  {t('Configurar partida')}
                </button>
              )}

              {configured && !completed && (
                <>
                  <div className="mt-2 text-xs text-cream/60">
                    {t('Ordem de saque:')} {match!.serveOrder.map(name).join(', ')}
                  </div>
                  {notStartedYet && confirm?.kind === 'delete-match' && confirm.matchId === match!.id ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <p className="text-xs text-destructive">
                        {t(
                          '⚠ Excluir esta configuração de partida (times e ordem de saque)? Você vai precisar configurar de novo. Isso não pode ser desfeito.',
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={secondaryButton}
                          onClick={() => setConfirm(null)}
                        >
                          {t('Cancelar')}
                        </button>
                        <button
                          type="button"
                          className={`${destructiveButton} flex-1`}
                          disabled={busy}
                          onClick={() => handleDeleteMatch(match!.id)}
                        >
                          {t('Confirmar exclusão')}
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
                        {t(match!.status === 'in_progress' ? 'Continuar partida' : 'Iniciar partida')}
                      </button>
                      {notStartedYet && (
                        <button
                          type="button"
                          className={secondaryButton}
                          onClick={() => setConfirm({ kind: 'delete-match', matchId: match!.id })}
                        >
                          {t('Excluir')}
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
              {t(
                'Encerrar este torneio? As partidas já jogadas continuam no histórico e no ranking. Você poderá começar um torneio novo em seguida.',
              )}
            </p>
            <div className="flex gap-2">
              <button type="button" className={secondaryButton} onClick={() => setConfirm(null)}>
                {t('Cancelar')}
              </button>
              <button
                type="button"
                className={`${primaryButton} flex-1`}
                disabled={busy}
                onClick={handleFinish}
              >
                {t('Encerrar e começar novo')}
              </button>
            </div>
          </div>
        ) : confirm?.kind === 'delete-tournament' ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-destructive">
              {t(
                '⚠ Excluir este torneio inteiro, com todas as suas partidas? Essa ação não pode ser desfeita.',
              )}
            </p>
            <div className="flex gap-2">
              <button type="button" className={secondaryButton} onClick={() => setConfirm(null)}>
                {t('Cancelar')}
              </button>
              <button
                type="button"
                className={`${destructiveButton} flex-1`}
                disabled={busy}
                onClick={handleDeleteTournament}
              >
                {t('Sim, excluir tudo')}
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
              {t('Encerrar torneio')}
            </button>
            <button
              type="button"
              className={destructiveButton}
              onClick={() => setConfirm({ kind: 'delete-tournament' })}
            >
              {t('Excluir torneio')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
