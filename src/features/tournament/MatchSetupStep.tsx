import { useMemo, useState } from 'react'
import { buildServeOrder, type CourtSide } from '../../engine/serve'
import type { PlayerId, Team } from '../../engine/types'
import type { PlayerRow, RoundRecord } from '../../db/db'
import { createMatchForRound } from '../../db/db'
import { shuffle } from '../../lib/shuffle'
import { card, primaryButton, secondaryButton, toggleButton } from '../../ui/styles'
import { HelpHint } from '../../ui/HelpHint'
import { useT } from '../../i18n/useT'

interface Props {
  tournamentId: string
  round: RoundRecord
  byId: Map<PlayerId, PlayerRow>
  onDone: () => void
  onDoneAndStart: (matchId: string) => void
  onBack: () => void
}

type OrderMode = 'random' | 'manual'

function randomServeOrder(team1: Team, team2: Team): PlayerId[] {
  const shuffledTeam1 = shuffle(team1)
  const shuffledTeam2 = shuffle(team2)
  const [first, second] = shuffle([shuffledTeam1, shuffledTeam2])
  return buildServeOrder(first, second)
}

export function MatchSetupStep({ tournamentId, round, byId, onDone, onDoneAndStart, onBack }: Props) {
  const { t } = useT()
  const [mode, setMode] = useState<OrderMode>('random')
  const [randomOrder, setRandomOrder] = useState<PlayerId[]>(() =>
    randomServeOrder(round.team1, round.team2),
  )
  const [manualOrder, setManualOrder] = useState<PlayerId[]>([])
  const [team1InitialSide, setTeam1InitialSide] = useState<CourtSide>('Esquerda')
  const [saving, setSaving] = useState(false)

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'
  const teamName = (ids: PlayerId[]) =>
    ids.map(name).sort((a, b) => a.localeCompare(b, 'pt-BR')).join(' & ')
  const teamOf = (id: PlayerId): 'team1' | 'team2' => (round.team1.includes(id) ? 'team1' : 'team2')

  const allPlayers = useMemo(() => [...round.team1, ...round.team2], [round.team1, round.team2])
  const totalSlots = allPlayers.length

  const canPickManually = (id: PlayerId) => {
    if (manualOrder.includes(id)) return false
    if (manualOrder.length === 0) return true
    const lastTeam = teamOf(manualOrder[manualOrder.length - 1])
    return teamOf(id) !== lastTeam
  }

  const pickManual = (id: PlayerId) => {
    if (!canPickManually(id)) return
    setManualOrder((prev) => [...prev, id])
  }

  const serveOrder = mode === 'random' ? randomOrder : manualOrder
  const canConfirm = serveOrder.length === totalSlots && !saving

  const handleConfirm = async (startNow: boolean) => {
    if (!canConfirm) return
    setSaving(true)
    const match = await createMatchForRound({
      tournamentId,
      roundIndex: round.index,
      team1: round.team1,
      team2: round.team2,
      serveOrder,
      team1InitialSide,
    })
    if (startNow) onDoneAndStart(match.id)
    else onDone()
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">
          {t('Configurar partida')} — {t('Rodada')} {round.index + 1}
        </h1>
        <p className="text-sm text-cream/70">
          <span className="font-semibold text-lime">{t('Time 1')}:</span> {teamName(round.team1)}
          <span className="text-cream/50"> {t('vs')} </span>
          <span className="font-semibold text-cream">{t('Time 2')}:</span> {teamName(round.team2)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-cream/80">
          {t('Ordem de saque')}
          <HelpHint
            text={t(
              'Cada jogador saca um game inteiro; a ordem roda entre os dois times, então quem saca em seguida é sempre do time adversário.',
            )}
          />
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('random')}
            className={toggleButton(mode === 'random')}
          >
            {t('Sortear')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('manual')
              setManualOrder([])
            }}
            className={toggleButton(mode === 'manual')}
          >
            {t('Escolher')}
          </button>
        </div>
      </div>

      {mode === 'random' && (
        <div className={card}>
          <ol className="flex flex-col gap-1">
            {randomOrder.map((id, i) => (
              <li key={id}>
                {i + 1}. {name(id)}
              </li>
            ))}
          </ol>
          <button
            type="button"
            className={`${secondaryButton} mt-3`}
            onClick={() => setRandomOrder(randomServeOrder(round.team1, round.team2))}
          >
            {t('Sortear novamente')}
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <div className={card}>
          <p className="mb-2 text-xs text-cream/60">
            {t(
              'Toque na ordem em que cada jogador vai sacar (jogadores consecutivos são sempre de times opostos).',
            )}
          </p>
          <ol className="mb-3 flex flex-col gap-1">
            {manualOrder.map((id, i) => (
              <li key={id}>
                {i + 1}. {name(id)}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            {allPlayers
              .filter((id) => !manualOrder.includes(id))
              .map((id) => {
                const enabled = canPickManually(id)
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!enabled}
                    onClick={() => pickManual(id)}
                    className="min-h-11 rounded-lg border border-cream/30 px-3 py-2 text-sm font-semibold disabled:opacity-30"
                  >
                    {name(id)}
                  </button>
                )
              })}
          </div>
          {manualOrder.length > 0 && (
            <button
              type="button"
              className={`${secondaryButton} mt-3`}
              onClick={() => setManualOrder([])}
            >
              {t('Reiniciar')}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-cream/80">
          {t('Lado inicial da quadra')}
          <HelpHint
            text={t(
              'De que lado da quadra o Time 1 começa (visto de quem está assistindo). O Time 2 começa do lado oposto. Isso muda a cada troca de lado durante a partida.',
            )}
          />
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTeam1InitialSide('Esquerda')}
            className={toggleButton(team1InitialSide === 'Esquerda')}
          >
            {t('Time 1 na esquerda')}
          </button>
          <button
            type="button"
            onClick={() => setTeam1InitialSide('Direita')}
            className={toggleButton(team1InitialSide === 'Direita')}
          >
            {t('Time 1 na direita')}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <div className="flex gap-2">
          <button type="button" className={secondaryButton} onClick={onBack}>
            {t('Voltar')}
          </button>
          <button
            type="button"
            className={`${secondaryButton} flex-1`}
            disabled={!canConfirm}
            onClick={() => handleConfirm(false)}
          >
            {saving ? t('Salvando...') : t('Confirmar partida')}
          </button>
        </div>
        <button
          type="button"
          className={primaryButton}
          disabled={!canConfirm}
          onClick={() => handleConfirm(true)}
        >
          {saving ? t('Salvando...') : t('Confirmar e iniciar partida')}
        </button>
      </div>
    </div>
  )
}
