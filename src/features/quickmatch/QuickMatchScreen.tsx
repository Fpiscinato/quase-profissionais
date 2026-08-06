import { useState } from 'react'
import { usePlayers } from '../../db/hooks'
import { createTournament, type TournamentFormat } from '../../db/db'
import { DEFAULT_MATCH_CONFIG } from '../../engine/types'
import type { PlayerId } from '../../engine/types'
import { card, primaryButton, secondaryButton, toggleButton } from '../../ui/styles'
import { HelpHint } from '../../ui/HelpHint'
import { useT } from '../../i18n/useT'

const GAMES_TO_WIN_OPTIONS = [2, 3, 4, 5, 6] as const

interface Props {
  onCreated: (tournamentId: string) => void
  onBack: () => void
}

type TeamPick = 'team1' | 'team2' | 'none'

/**
 * A single quick match outside the full tournament flow (no disponibilidade
 * / rotação): pick the format, pick exactly who's on each side, pick the set
 * length, and go straight to setup (serve order + lado inicial) and then
 * live. Under the hood it's still a real 1-round tournament (createTournament),
 * so it counts in ranking/history like any other match.
 */
export function QuickMatchScreen({ onCreated, onBack }: Props) {
  const { t } = useT()
  const { players } = usePlayers()
  const [format, setFormat] = useState<TournamentFormat>('duplas')
  const [team1, setTeam1] = useState<PlayerId[]>([])
  const [team2, setTeam2] = useState<PlayerId[]>([])
  const [gamesToWinSet, setGamesToWinSet] = useState(DEFAULT_MATCH_CONFIG.gamesToWinSet)
  const [saving, setSaving] = useState(false)

  const maxPerTeam = format === 'duplas' ? 2 : 1

  const pickOf = (id: PlayerId): TeamPick => {
    if (team1.includes(id)) return 'team1'
    if (team2.includes(id)) return 'team2'
    return 'none'
  }

  const setFormatAndReset = (next: TournamentFormat) => {
    setFormat(next)
    setTeam1([])
    setTeam2([])
  }

  const cyclePlayer = (id: PlayerId) => {
    const pick = pickOf(id)
    if (pick === 'none') {
      if (team1.length < maxPerTeam) setTeam1((t) => [...t, id])
      else if (team2.length < maxPerTeam) setTeam2((t) => [...t, id])
      return
    }
    if (pick === 'team1') {
      setTeam1((t) => t.filter((p) => p !== id))
      if (team2.length < maxPerTeam) setTeam2((t) => [...t, id])
      return
    }
    setTeam2((t) => t.filter((p) => p !== id))
  }

  const name = (id: PlayerId) => players.find((p) => p.id === id)?.name ?? '?'
  const canConfirm = team1.length === maxPerTeam && team2.length === maxPerTeam && !saving

  const handleConfirm = async () => {
    if (!canConfirm) return
    setSaving(true)
    const tournament = await createTournament({
      availablePlayerIds: [...team1, ...team2],
      format,
      teamFormationMode: 'manual',
      rounds: [{ team1, team2, restingPlayerIds: [] }],
      options: { ...DEFAULT_MATCH_CONFIG, gamesToWinSet },
    })
    onCreated(tournament.id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">{t('Partida avulsa')}</h1>
        <p className="text-sm text-cream/70">
          {t('Um jogo único, sem rotação de torneio — vale pro ranking e pro histórico normalmente.')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-cream/80">{t('Formato')}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormatAndReset('duplas')}
            className={toggleButton(format === 'duplas')}
          >
            {t('Duplas')}
          </button>
          <button
            type="button"
            onClick={() => setFormatAndReset('individual')}
            className={toggleButton(format === 'individual')}
          >
            {t('Individual')}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-cream/80">
          {t('Jogadores')}
          <HelpHint
            text={t(
              'Toque num jogador pra colocar no Time 1, toque de novo pra mover pro Time 2, e mais uma vez pra tirar.',
            )}
          />
        </span>
        <p className="text-xs text-cream/60">
          {t('Time 1')}: {team1.length}/{maxPerTeam} · {t('Time 2')}: {team2.length}/{maxPerTeam}
        </p>
        <div className="flex flex-wrap gap-2">
          {players.map((player) => {
            const pick = pickOf(player.id)
            const bothFull = team1.length >= maxPerTeam && team2.length >= maxPerTeam
            return (
              <button
                key={player.id}
                type="button"
                disabled={pick === 'none' && bothFull}
                onClick={() => cyclePlayer(player.id)}
                className={`min-h-11 rounded-lg border-2 px-3 py-2 text-sm font-semibold disabled:opacity-30 ${
                  pick === 'team1'
                    ? 'border-lime bg-lime/10 text-lime'
                    : pick === 'team2'
                      ? 'border-cream bg-cream/10 text-cream'
                      : 'border-cream/20 text-cream/70'
                }`}
              >
                {player.name}
                {pick === 'team1' && ` · ${t('Time 1')}`}
                {pick === 'team2' && ` · ${t('Time 2')}`}
              </button>
            )
          })}
        </div>
      </div>

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
        <p className="text-xs text-cream/60">
          {t(
            'No tênis oficial o set vai até 6 games (com 2 de vantagem) — vale pra Duplas e Individual. Aqui você pode encurtar pra jogos mais rápidos.',
          )}
        </p>
      </div>

      {team1.length === maxPerTeam && team2.length === maxPerTeam && (
        <div className={card}>
          <div className="font-semibold">
            {team1.map(name).join(' & ')} <span className="text-cream/50">vs</span>{' '}
            {team2.map(name).join(' & ')}
          </div>
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <button type="button" className={secondaryButton} onClick={onBack}>
          {t('Voltar')}
        </button>
        <button
          type="button"
          className={`${primaryButton} flex-1`}
          disabled={!canConfirm}
          onClick={handleConfirm}
        >
          {saving ? t('Criando...') : t('Ir para configurar partida')}
        </button>
      </div>
    </div>
  )
}
