import { useMemo, useState } from 'react'
import { generateDoublesRotation, generateSinglesRotation } from '../../engine/schedule'
import { DEFAULT_MATCH_CONFIG } from '../../engine/types'
import type { PlayerId, ScheduledMatch } from '../../engine/types'
import { usePlayers } from '../../db/hooks'
import { createTournament, type TeamFormationMode, type TournamentFormat } from '../../db/db'
import { shuffle } from '../../lib/shuffle'
import { ManualRoundsEditor } from './ManualRoundsEditor'
import { card, primaryButton, secondaryButton, toggleButton } from '../../ui/styles'
import { HelpHint } from '../../ui/HelpHint'
import { useT } from '../../i18n/useT'

const GAMES_TO_WIN_OPTIONS = [2, 3, 4, 5, 6] as const

interface Props {
  availablePlayerIds: PlayerId[]
  onCreated: (tournamentId: string) => void
  onBack: () => void
}

export function FormatRotationStep({ availablePlayerIds, onCreated, onBack }: Props) {
  const { t } = useT()
  const { byId } = usePlayers()
  const canDoDoubles = availablePlayerIds.length >= 4
  const [format, setFormat] = useState<TournamentFormat>(canDoDoubles ? 'duplas' : 'individual')
  const [mode, setMode] = useState<TeamFormationMode>('balanced')
  const [gamesToWinSet, setGamesToWinSet] = useState(DEFAULT_MATCH_CONFIG.gamesToWinSet)
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [manualRounds, setManualRounds] = useState<ScheduledMatch[] | null>(null)
  const [saving, setSaving] = useState(false)

  const balancedRounds = useMemo<ScheduledMatch[]>(() => {
    const seeded = shuffle(availablePlayerIds)
    return format === 'duplas' ? generateDoublesRotation(seeded) : generateSinglesRotation(seeded)
    // shuffleSeed forces a re-shuffle when the organiser taps "Sortear novamente".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePlayerIds.join(','), format, shuffleSeed])

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'
  const teamName = (team: PlayerId[]) =>
    team.map(name).sort((a, b) => a.localeCompare(b, 'pt-BR')).join(' & ')

  const finalRounds = mode === 'balanced' ? balancedRounds : manualRounds
  const canConfirm = !!finalRounds && finalRounds.length > 0 && !saving

  const handleConfirm = async () => {
    if (!finalRounds) return
    setSaving(true)
    const tournament = await createTournament({
      availablePlayerIds,
      format,
      teamFormationMode: mode,
      rounds: finalRounds.map((r) => ({
        team1: r.team1,
        team2: r.team2,
        restingPlayerIds: r.restingPlayerIds,
      })),
      options: { ...DEFAULT_MATCH_CONFIG, gamesToWinSet },
    })
    onCreated(tournament.id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">{t('Formato e rotação')}</h1>
        <p className="text-sm text-cream/70">
          {availablePlayerIds.length} {t('jogadores disponíveis.')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-cream/80">
          {t('Formato')}
          <HelpHint
            text={t(
              'Duplas (Americano) precisa de 4+ jogadores e forma times de 2. Individual é todos-contra-todos, um jogador por vez, a partir de 2.',
            )}
          />
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canDoDoubles}
            onClick={() => {
              setFormat('duplas')
              setMode('balanced')
              setManualRounds(null)
            }}
            className={`${toggleButton(format === 'duplas')} disabled:opacity-30`}
          >
            {t('Duplas (Americano)')}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormat('individual')
              setMode('balanced')
              setManualRounds(null)
            }}
            className={toggleButton(format === 'individual')}
          >
            {t('Individual')}
          </button>
        </div>
        {!canDoDoubles && (
          <p className="text-xs text-cream/60">{t('Duplas precisa de 4+ jogadores disponíveis.')}</p>
        )}
      </div>

      {format === 'duplas' && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-cream/80">
            {t('Formação das duplas')}
            <HelpHint
              text={t(
                'Balanceado sorteia e distribui as duplas de forma justa (descanso e parceiros variados). Manual deixa você escolher quem joga com quem em cada rodada.',
              )}
            />
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('balanced')}
              className={toggleButton(mode === 'balanced')}
            >
              {t('Balanceado (recomendado)')}
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={toggleButton(mode === 'manual')}
            >
              {t('Manual')}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-cream/80">
          {t('Games para vencer o set')}
          <HelpHint
            text={t(
              'Quantos games o time precisa fazer (com 2 de vantagem) pra vencer o set. Padrão: 4. Se empatar nesse número, vai pro tiebreak.',
            )}
          />
        </span>
        <div className="flex gap-2">
          {GAMES_TO_WIN_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setGamesToWinSet(n)}
              className={toggleButton(gamesToWinSet === n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {format === 'individual' && (
        <p className="text-sm text-cream/70">
          {t('No Individual todo mundo joga contra todo mundo uma vez — não há escolha de duplas.')}
        </p>
      )}

      {mode === 'balanced' && (
        <div className="flex flex-col gap-2">
          {balancedRounds.map((round) => (
            <div key={round.roundIndex} className={card}>
              <div className="mb-1 text-xs text-cream/60">Rodada {round.roundIndex + 1}</div>
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
            </div>
          ))}
          <button
            type="button"
            className={secondaryButton}
            onClick={() => setShuffleSeed((s) => s + 1)}
          >
            Sortear novamente
          </button>
        </div>
      )}

      {mode === 'manual' && format === 'duplas' && (
        <ManualRoundsEditor
          availablePlayerIds={availablePlayerIds}
          byId={byId}
          onChange={setManualRounds}
        />
      )}

      <div className="mt-2 flex gap-2">
        <button type="button" className={secondaryButton} onClick={onBack}>
          Voltar
        </button>
        <button
          type="button"
          className={`${primaryButton} flex-1`}
          disabled={!canConfirm}
          onClick={handleConfirm}
        >
          {saving ? 'Criando...' : 'Confirmar e criar torneio'}
        </button>
      </div>
    </div>
  )
}
