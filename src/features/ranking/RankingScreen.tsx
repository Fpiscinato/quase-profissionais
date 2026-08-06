import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db/db'
import type { MatchRow } from '../../db/db'
import { usePlayers } from '../../db/hooks'
import { computeStandings, computeTeamStandings } from '../../engine/ranking'
import type { MatchResult, PlayerId } from '../../engine/types'
import { toggleButton } from '../../ui/styles'
import { useT } from '../../i18n/useT'

function toMatchResult(m: MatchRow): MatchResult {
  return {
    team1: m.team1,
    team2: m.team2,
    games1: m.games1,
    games2: m.games2,
    points1: m.points1,
    points2: m.points2,
    winnerTeam: m.winnerTeam!,
  }
}

type Tab = 'dia' | 'geral'
type Mode = 'individual' | 'duplas'

export function RankingScreen() {
  const { t } = useT()
  const [tab, setTab] = useState<Tab>('dia')
  const [mode, setMode] = useState<Mode>('individual')
  const { byId } = usePlayers()

  // "Current tournament" = the most recently created one, independent of
  // wizard/session state, so the ranking still works after navigating away.
  const latestTournament = useLiveQuery(
    () => db.tournaments.orderBy('createdAt').reverse().first(),
    [],
  )
  const allCompletedMatches = useLiveQuery(
    () => db.matches.where('status').equals('completed').toArray(),
    [],
    [],
  )

  const matchesForTab =
    tab === 'dia'
      ? allCompletedMatches.filter((m) => m.tournamentId === latestTournament?.id)
      : allCompletedMatches
  const matchResults = matchesForTab.map(toMatchResult)

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'
  const teamName = (ids: PlayerId[]) =>
    ids.map(name).sort((a, b) => a.localeCompare(b, 'pt-BR')).join(' & ')

  const individualStandings = computeStandings(matchResults)
  const teamStandings = computeTeamStandings(matchResults)
  const rowCount = mode === 'individual' ? individualStandings.length : teamStandings.length
  const uneven =
    mode === 'individual'
      ? individualStandings.some((s) => s.matchesPlayed !== individualStandings[0]?.matchesPlayed)
      : teamStandings.some((s) => s.matchesPlayed !== teamStandings[0]?.matchesPlayed)

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">{t('Ranking')}</h1>

      <div className="flex gap-2">
        <button type="button" onClick={() => setTab('dia')} className={toggleButton(tab === 'dia')}>
          {t('Ranking do dia')}
        </button>
        <button type="button" onClick={() => setTab('geral')} className={toggleButton(tab === 'geral')}>
          {t('Ranking geral')}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('individual')}
          className={toggleButton(mode === 'individual')}
        >
          {t('Individual')}
        </button>
        <button
          type="button"
          onClick={() => setMode('duplas')}
          className={toggleButton(mode === 'duplas')}
        >
          {t('Duplas')}
        </button>
      </div>

      {rowCount === 0 ? (
        <p className="text-sm text-cream/70">
          {t(
            tab === 'dia'
              ? 'Nenhuma partida concluída no torneio mais recente ainda.'
              : 'Nenhuma partida concluída ainda.',
          )}
        </p>
      ) : (
        <>
          {uneven && (
            <p className="text-xs text-gold">
              {t('Nem todos jogaram o mesmo número de partidas.')}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-cream/60">
                  <th className="py-1 pr-2">#</th>
                  <th className="py-1 pr-2">{t(mode === 'individual' ? 'Jogador' : 'Dupla')}</th>
                  <th className="py-1 pr-2 text-right">{t('PJ')}</th>
                  <th className="py-1 pr-2 text-right">{t('PV')}</th>
                  <th className="py-1 pr-2 text-right">{t('GV')}</th>
                  <th className="py-1 pr-2 text-right">{t('GP')}</th>
                  <th className="py-1 pr-2 text-right">{t('PtV')}</th>
                  <th className="py-1 text-right">{t('PtP')}</th>
                </tr>
              </thead>
              <tbody>
                {mode === 'individual'
                  ? individualStandings.map((s, i) => (
                      <tr key={s.playerId} className={i === 0 ? 'font-bold text-gold' : ''}>
                        <td className="py-1 pr-2">{i + 1}</td>
                        <td className="py-1 pr-2">{name(s.playerId)}</td>
                        <td className="py-1 pr-2 text-right">{s.matchesPlayed}</td>
                        <td className="py-1 pr-2 text-right">{s.matchesWon}</td>
                        <td className="py-1 pr-2 text-right">{s.gamesWon}</td>
                        <td className="py-1 pr-2 text-right">{s.gamesLost}</td>
                        <td className="py-1 pr-2 text-right">{s.pointsWon}</td>
                        <td className="py-1 text-right">{s.pointsLost}</td>
                      </tr>
                    ))
                  : teamStandings.map((s, i) => (
                      <tr key={s.playerIds.join('|')} className={i === 0 ? 'font-bold text-gold' : ''}>
                        <td className="py-1 pr-2">{i + 1}</td>
                        <td className="py-1 pr-2">{teamName(s.playerIds)}</td>
                        <td className="py-1 pr-2 text-right">{s.matchesPlayed}</td>
                        <td className="py-1 pr-2 text-right">{s.matchesWon}</td>
                        <td className="py-1 pr-2 text-right">{s.gamesWon}</td>
                        <td className="py-1 pr-2 text-right">{s.gamesLost}</td>
                        <td className="py-1 pr-2 text-right">{s.pointsWon}</td>
                        <td className="py-1 text-right">{s.pointsLost}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-cream/50">
            {t(
              'PJ partidas jogadas · PV partidas vencidas · GV games vencidos · GP games perdidos · PtV pontos vencidos · PtP pontos perdidos',
            )}
            {mode === 'duplas' &&
              ` · ${t('Duplas: só conta quem jogou junto na mesma dupla.')}`}
          </p>
        </>
      )}
    </div>
  )
}
