import { useEffect, useMemo, useState } from 'react'
import { generateDoublesRotation } from '../../engine/schedule'
import type { PlayerId, ScheduledMatch } from '../../engine/types'
import type { PlayerRow } from '../../db/db'
import { shuffle } from '../../lib/shuffle'
import { card, toggleButton } from '../../ui/styles'

interface Props {
  availablePlayerIds: PlayerId[]
  byId: Map<PlayerId, PlayerRow>
  onChange: (rounds: ScheduledMatch[] | null) => void
}

interface RoundDraft {
  index: number
  playing: PlayerId[]
  restingPlayerIds: PlayerId[]
  team1: Set<PlayerId>
}

/**
 * Manual team formation (Section 2 doubles): the balanced rest-rotation from
 * the engine still decides who plays vs. rests each round (so rests stay
 * even), but the organiser chooses who partners whom among that round's 4
 * players instead of the algorithm.
 */
export function ManualRoundsEditor({ availablePlayerIds, byId, onChange }: Props) {
  const base = useMemo(
    () => generateDoublesRotation(shuffle(availablePlayerIds)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availablePlayerIds.join(',')],
  )

  const [rounds, setRounds] = useState<RoundDraft[]>(() =>
    base.map((r) => ({
      index: r.roundIndex,
      playing: [...r.team1, ...r.team2],
      restingPlayerIds: r.restingPlayerIds,
      team1: new Set(r.team1),
    })),
  )

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'

  const togglePlayer = (roundIndex: number, playerId: PlayerId) => {
    setRounds((prev) =>
      prev.map((r) => {
        if (r.index !== roundIndex) return r
        const team1 = new Set(r.team1)
        if (team1.has(playerId)) {
          team1.delete(playerId)
        } else if (team1.size < 2) {
          team1.add(playerId)
        }
        return { ...r, team1 }
      }),
    )
  }

  useEffect(() => {
    const allValid = rounds.every((r) => r.team1.size === 2)
    if (!allValid) {
      onChange(null)
      return
    }
    onChange(
      rounds.map((r) => ({
        roundIndex: r.index,
        team1: r.playing.filter((p) => r.team1.has(p)),
        team2: r.playing.filter((p) => !r.team1.has(p)),
        restingPlayerIds: r.restingPlayerIds,
      })),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds])

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-cream/70">
        Toque em 2 jogadores de cada rodada para formar o Time 1 — os outros 2 formam o Time 2.
        Quem descansa já está balanceado.
      </p>
      {rounds.map((round) => (
        <div key={round.index} className={card}>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">Rodada {round.index + 1}</span>
            <span className="text-xs text-cream/60">
              Descansa:{' '}
              {round.restingPlayerIds
                .map(name)
                .sort((a, b) => a.localeCompare(b, 'pt-BR'))
                .join(', ') || '—'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {round.playing.map((playerId) => {
              const onTeam1 = round.team1.has(playerId)
              return (
                <button
                  key={playerId}
                  type="button"
                  onClick={() => togglePlayer(round.index, playerId)}
                  className={toggleButton(onTeam1, false)}
                >
                  {name(playerId)} {onTeam1 ? '· Time 1' : ''}
                </button>
              )
            })}
          </div>
          {round.team1.size !== 2 && (
            <p className="mt-2 text-xs text-destructive">Escolha exatamente 2 para o Time 1.</p>
          )}
        </div>
      ))}
    </div>
  )
}
