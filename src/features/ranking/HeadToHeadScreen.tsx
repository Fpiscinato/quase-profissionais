import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db/db'
import { type MatchRow } from '../../db/db'
import { usePlayers } from '../../db/hooks'
import { computeHeadToHead, type HeadToHeadResult } from '../../engine/ranking'
import type { MatchResult, PlayerId } from '../../engine/types'
import { card } from '../../ui/styles'
import { useT } from '../../i18n/useT'

function toMatchResult(m: MatchRow): MatchResult {
  const sets1 = m.sets1 ?? (m.winnerTeam === 'team1' ? 1 : 0)
  const sets2 = m.sets2 ?? (m.winnerTeam === 'team2' ? 1 : 0)
  return {
    team1: m.team1,
    team2: m.team2,
    games1: m.games1,
    games2: m.games2,
    points1: m.points1,
    points2: m.points2,
    sets1,
    sets2,
    winnerTeam: m.winnerTeam!,
  }
}

const selectCls = 'min-h-11 flex-1 rounded-lg border border-cream/30 bg-navy px-3 text-sm font-semibold text-cream'

export function HeadToHeadScreen() {
  const { t } = useT()
  const { players, byId } = usePlayers()
  const allMatches = useLiveQuery(() => db.matches.toArray(), [], [])
  const [player1Id, setPlayer1Id] = useState<PlayerId | ''>('')
  const [player2Id, setPlayer2Id] = useState<PlayerId | ''>('')

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'
  const names = (ids: PlayerId[]) => ids.map(name).sort((a, b) => a.localeCompare(b, 'pt-BR')).join(' & ')

  const completedMatches = (allMatches ?? [])
    .filter((m) => m.status === 'completed')
    .map(toMatchResult)

  const selectedIds = new Set([player1Id, player2Id].filter(Boolean))
  // Only players that actually appear in at least one match can be pickers
  // worth offering — but everyone in the roster is still selectable; the
  // result just shows "no matches between them".
  const pickerOptions = [...players].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  let result: HeadToHeadResult | null = null
  if (player1Id && player2Id && player1Id !== player2Id) {
    result = computeHeadToHead(player1Id, player2Id, completedMatches)
  }

  const optionEls = (excludeId?: PlayerId) =>
    pickerOptions
      .filter((p) => p.id !== excludeId)
      .map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">{t('Confronto direto')}</h1>
        <p className="text-sm text-cream/70">
          {t(
            'Escolha dois jogadores pra ver quem leva a melhor quando se enfrentam. Só contam partidas em que estiveram em lados opostos.',
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className={`${card} flex items-center gap-2`}>
          <select
            aria-label={t('Jogador 1')}
            value={player1Id}
            onChange={(e) => setPlayer1Id(e.target.value as PlayerId | '')}
            className={selectCls}
          >
            <option value="">{t('Selecionar jogador 1...')}</option>
            {optionEls(player2Id || undefined)}
          </select>
          <span className="shrink-0 font-black text-lime">vs</span>
          <select
            aria-label={t('Jogador 2')}
            value={player2Id}
            onChange={(e) => setPlayer2Id(e.target.value as PlayerId | '')}
            className={selectCls}
          >
            <option value="">{t('Selecionar jogador 2...')}</option>
            {optionEls(player1Id || undefined)}
          </select>
        </div>

        {!result && (
          <p className="text-center text-sm text-cream/60">
            {t(selectedIds.size === 2 ? 'Esses dois nunca se enfrentaram.' : 'Escolha dois jogadores pra começar.')}
          </p>
        )}

        {result && result.totalMatches === 0 && (
          <div className={card}>
            <p className="text-sm text-cream/70">
              {t('Nenhuma partida registrada entre esses dois ainda.')}
            </p>
          </div>
        )}

        {result && result.totalMatches > 0 && (
          <>
            <div className={`${card} flex items-center justify-around py-4`}>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-lg font-bold">{name(result.player1Id)}</span>
                <span className="text-4xl font-black text-lime">{result.player1Wins}</span>
              </div>
              <span className="text-xs font-bold text-cream/50">
                {result.player1Wins === result.player2Wins ? t('Empate') : t('Conf.')}
              </span>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-lg font-bold">{name(result.player2Id)}</span>
                <span className="text-4xl font-black text-gold">{result.player2Wins}</span>
              </div>
            </div>

            <div className={card}>
              <h2 className="mb-2 font-semibold">{t('Histórico dos confrontos')}</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {result.matches.map((m, i) => {
                  const p1Won = m.winnerPlayer === result.player1Id
                  const winner = p1Won ? result.player1Id : result.player2Id
                  return (
                    <li
                      key={i}
                      className="flex flex-col gap-0.5 rounded-lg bg-navy px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-cream/70">
                          {names(m.team1)}{' '}
                          <span className="mx-1 text-cream/50">{t('vs')}</span>
                          {names(m.team2)}
                        </span>
                        <span className="font-mono text-cream">{m.games1} × {m.games2}</span>
                      </div>
                      <div className="text-xs">
                        <span className={winner === result.player1Id ? 'text-lime' : 'text-gold'}>
                          {t('Venceu:')} {name(winner)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}