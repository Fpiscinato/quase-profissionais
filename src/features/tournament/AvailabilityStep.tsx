import { useState } from 'react'
import { usePlayers } from '../../db/hooks'
import type { PlayerId } from '../../engine/types'
import { primaryButton, label as labelClass } from '../../ui/styles'
import { useT } from '../../i18n/useT'

interface Props {
  onContinue: (availablePlayerIds: PlayerId[]) => void
}

export function AvailabilityStep({ onContinue }: Props) {
  const { t } = useT()
  const { players } = usePlayers()
  const [selected, setSelected] = useState<Set<PlayerId>>(new Set())

  const toggle = (id: PlayerId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const canContinue = selected.size >= 2

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">{t('Quem joga hoje?')}</h1>
        <p className="text-sm text-cream/70">{t('Marque os jogadores disponíveis. Mínimo 2.')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="min-h-9 rounded-lg border border-cream/20 px-3 text-xs font-semibold text-cream/70 active:bg-white/10"
            onClick={() => setSelected(new Set(players.map((p) => p.id)))}
          >
            {t('Todos')}
          </button>
          <button
            type="button"
            className="min-h-9 rounded-lg border border-cream/20 px-3 text-xs font-semibold text-cream/70 active:bg-white/10"
            onClick={() => setSelected(new Set())}
          >
            {t('Nenhum')}
          </button>
        </div>
        {players.map((player) => (
          <label key={player.id} className={labelClass}>
            <input
              type="checkbox"
              className="h-5 w-5 accent-lime"
              checked={selected.has(player.id)}
              onChange={() => toggle(player.id)}
            />
            <span>{player.name}</span>
          </label>
        ))}
      </div>

      {selected.size === 1 && (
        <p className="text-sm text-destructive">{t('Marque pelo menos mais um jogador.')}</p>
      )}

      <button
        type="button"
        className={primaryButton}
        disabled={!canContinue}
        onClick={() => onContinue(Array.from(selected))}
      >
        {t('Continuar')} ({selected.size} {selected.size === 1 ? t('jogador') : t('jogadores')})
      </button>
    </div>
  )
}
