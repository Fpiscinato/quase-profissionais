import { useMemo, useState } from 'react'
import { generateDoublesRotation, generateSinglesRotation } from '../../engine/schedule'
import type { PlayerId, ScheduledMatch } from '../../engine/types'
import { usePlayers } from '../../db/hooks'
import { createTournament, type TeamFormationMode, type TournamentFormat } from '../../db/db'
import { shuffle } from '../../lib/shuffle'
import { ManualRoundsEditor } from './ManualRoundsEditor'
import { card, primaryButton, secondaryButton } from '../../ui/styles'
import { HelpHint } from '../../ui/HelpHint'

interface Props {
  availablePlayerIds: PlayerId[]
  onCreated: (tournamentId: string) => void
  onBack: () => void
}

export function FormatRotationStep({ availablePlayerIds, onCreated, onBack }: Props) {
  const { byId } = usePlayers()
  const canDoDoubles = availablePlayerIds.length >= 4
  const [format, setFormat] = useState<TournamentFormat>(canDoDoubles ? 'duplas' : 'individual')
  const [mode, setMode] = useState<TeamFormationMode>('balanced')
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
    })
    onCreated(tournament.id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">Formato e rotação</h1>
        <p className="text-sm text-cream/70">{availablePlayerIds.length} jogadores disponíveis.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-cream/80">
          Formato
          <HelpHint text="Duplas (Americano) precisa de 4+ jogadores e forma times de 2. Individual é todos-contra-todos, um jogador por vez, a partir de 2." />
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
            className={`min-h-11 flex-1 rounded-lg px-3 py-2 font-semibold disabled:opacity-30 ${
              format === 'duplas' ? 'bg-lime text-navy' : 'border border-cream/30'
            }`}
          >
            Duplas (Americano)
          </button>
          <button
            type="button"
            onClick={() => {
              setFormat('individual')
              setMode('balanced')
              setManualRounds(null)
            }}
            className={`min-h-11 flex-1 rounded-lg px-3 py-2 font-semibold ${
              format === 'individual' ? 'bg-lime text-navy' : 'border border-cream/30'
            }`}
          >
            Individual
          </button>
        </div>
        {!canDoDoubles && (
          <p className="text-xs text-cream/60">Duplas precisa de 4+ jogadores disponíveis.</p>
        )}
      </div>

      {format === 'duplas' && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-cream/80">
            Formação das duplas
            <HelpHint text="Balanceado sorteia e distribui as duplas de forma justa (descanso e parceiros variados). Manual deixa você escolher quem joga com quem em cada rodada." />
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('balanced')}
              className={`min-h-11 flex-1 rounded-lg px-3 py-2 font-semibold ${
                mode === 'balanced' ? 'bg-lime text-navy' : 'border border-cream/30'
              }`}
            >
              Balanceado (recomendado)
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`min-h-11 flex-1 rounded-lg px-3 py-2 font-semibold ${
                mode === 'manual' ? 'bg-lime text-navy' : 'border border-cream/30'
              }`}
            >
              Manual
            </button>
          </div>
        </div>
      )}

      {format === 'individual' && (
        <p className="text-sm text-cream/70">
          No Individual todo mundo joga contra todo mundo uma vez — não há escolha de duplas.
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
