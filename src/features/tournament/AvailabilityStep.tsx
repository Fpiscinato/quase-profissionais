import { useState } from 'react'
import { usePlayers } from '../../db/hooks'
import type { PlayerId } from '../../engine/types'
import { primaryButton, label as labelClass } from './ui'

interface Props {
  onContinue: (availablePlayerIds: PlayerId[]) => void
}

export function AvailabilityStep({ onContinue }: Props) {
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
        <h1 className="text-xl font-bold">Quem joga hoje?</h1>
        <p className="text-sm text-cream/70">Marque os jogadores disponíveis. Mínimo 2.</p>
      </div>

      <div className="flex flex-col gap-2">
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
        <p className="text-sm text-destructive">Marque pelo menos mais um jogador.</p>
      )}

      <button
        type="button"
        className={primaryButton}
        disabled={!canContinue}
        onClick={() => onContinue(Array.from(selected))}
      >
        Continuar ({selected.size} {selected.size === 1 ? 'jogador' : 'jogadores'})
      </button>
    </div>
  )
}
