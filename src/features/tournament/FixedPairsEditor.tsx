import { useEffect, useMemo, useState } from 'react'
import type { PlayerId } from '../../engine/types'
import type { PlayerRow } from '../../db/db'
import { card, secondaryButton, toggleButton } from '../../ui/styles'
import { useT } from '../../i18n/useT'

interface Props {
  availablePlayerIds: PlayerId[]
  byId: Map<PlayerId, PlayerRow>
  onChange: (pairs: [PlayerId, PlayerId][] | null) => void
}

/**
 * Fixed-pairs team formation (Section 2 alt.): the organiser locks in who
 * partners whom once — tap 2 players to form a pair, repeat until everyone
 * available is paired up. Unlike ManualRoundsEditor this isn't per round:
 * the same pairing holds for the whole tournament, and the schedule between
 * pairs is generated afterwards (generateFixedPairsRotation).
 */
export function FixedPairsEditor({ availablePlayerIds, byId, onChange }: Props) {
  const { t } = useT()
  const [pairs, setPairs] = useState<[PlayerId, PlayerId][]>([])
  const [pending, setPending] = useState<PlayerId | null>(null)

  // A fresh set of available players (ex.: voltou pra tela anterior e mudou
  // quem está disponível) invalida qualquer pareamento em andamento.
  useEffect(() => {
    setPairs([])
    setPending(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePlayerIds.join(',')])

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'

  const pairedIds = useMemo(() => new Set(pairs.flat()), [pairs])
  const remaining = availablePlayerIds
    .filter((id) => !pairedIds.has(id) && id !== pending)
    .sort((a, b) => name(a).localeCompare(name(b), 'pt-BR'))

  const isOdd = availablePlayerIds.length % 2 !== 0

  const togglePlayer = (playerId: PlayerId) => {
    if (pending === null) {
      setPending(playerId)
      return
    }
    if (pending === playerId) {
      setPending(null)
      return
    }
    setPairs((prev) => [...prev, [pending, playerId]])
    setPending(null)
  }

  const undoLastPair = () => {
    setPairs((prev) => prev.slice(0, -1))
  }

  const allPaired = !isOdd && pairedIds.size === availablePlayerIds.length && pairs.length >= 2

  useEffect(() => {
    onChange(allPaired ? pairs : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs, allPaired])

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-cream/70">
        {t(
          'Toque em 2 jogadores pra formar uma dupla fixa — repete até todo mundo estar pareado. Essa dupla vale pro torneio inteiro, sem trocar de parceiro entre rodadas.',
        )}
      </p>

      {isOdd && (
        <p className="text-xs text-destructive">
          {t('Duplas fixas precisa de um número par de jogadores disponíveis.')}
        </p>
      )}

      {pairs.length > 0 && (
        <div className={card}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream/60">
            {t('Duplas formadas')}
          </div>
          <div className="flex flex-col gap-1">
            {pairs.map(([a, b], i) => (
              <div key={i} className="text-sm font-semibold">
                {name(a)} & {name(b)}
              </div>
            ))}
          </div>
          <button type="button" className={`${secondaryButton} mt-2`} onClick={undoLastPair}>
            {t('Desfazer última dupla')}
          </button>
        </div>
      )}

      {(remaining.length > 0 || pending) && (
        <div className={card}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream/60">
            {pending ? t('Escolha o parceiro:') : t('Toque no primeiro jogador da dupla:')}
          </div>
          <div className="flex flex-wrap gap-2">
            {pending && (
              <button
                type="button"
                onClick={() => togglePlayer(pending)}
                className={toggleButton(true, false)}
              >
                {name(pending)}
              </button>
            )}
            {remaining.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => togglePlayer(id)}
                className={toggleButton(false, false)}
              >
                {name(id)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
