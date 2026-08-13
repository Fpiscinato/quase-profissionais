import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import { db } from '../../db/db'
import type { MatchRow } from '../../db/db'
import { usePlayers } from '../../db/hooks'
import { computeStandings, computeTeamStandings } from '../../engine/ranking'
import { computePlayerPlayTime, computeTeamPlayTime, totalPlaySeconds } from '../../engine/stats'
import type { MatchResult, PlayerId } from '../../engine/types'
import { formatDate } from '../../lib/format'
import { shareOrDownloadFile } from '../../lib/shareFile'
import { secondaryButton, toggleButton } from '../../ui/styles'
import { useT } from '../../i18n/useT'
import { HelpHint } from '../../ui/HelpHint'
import { modeMatchesPlayed } from './rankingFilter'
import { RankingReport, type RankingReportProps } from './RankingReport'

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
  const [sameGamesOnly, setSameGamesOnly] = useState(false)
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

  const individualStandingsAll = computeStandings(matchResults)
  const teamStandingsAll = computeTeamStandings(matchResults)
  const uneven =
    mode === 'individual'
      ? individualStandingsAll.some((s) => s.matchesPlayed !== individualStandingsAll[0]?.matchesPlayed)
      : teamStandingsAll.some((s) => s.matchesPlayed !== teamStandingsAll[0]?.matchesPlayed)

  const targetMatchesPlayed =
    sameGamesOnly && uneven
      ? modeMatchesPlayed(
          (mode === 'individual' ? individualStandingsAll : teamStandingsAll).map(
            (s) => s.matchesPlayed,
          ),
        )
      : null

  const individualStandings =
    targetMatchesPlayed === null
      ? individualStandingsAll
      : individualStandingsAll.filter((s) => s.matchesPlayed === targetMatchesPlayed)
  const teamStandings =
    targetMatchesPlayed === null
      ? teamStandingsAll
      : teamStandingsAll.filter((s) => s.matchesPlayed === targetMatchesPlayed)

  const rowCount = mode === 'individual' ? individualStandings.length : teamStandings.length
  const totalCount = mode === 'individual' ? individualStandingsAll.length : teamStandingsAll.length

  const [sharing, setSharing] = useState(false)
  const [reportProps, setReportProps] = useState<RankingReportProps | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const handleShare = () => {
    setSharing(true)
    const completedWithDuration = allCompletedMatches.map((m) => ({
      ...m,
      durationSeconds: m.durationSeconds ?? 0,
    }))
    setReportProps({
      scopeLabel:
        tab === 'dia'
          ? latestTournament
            ? `${t('Ranking do dia')} — ${formatDate(latestTournament.date)}`
            : t('Ranking do dia')
          : t('Ranking geral'),
      generatedAtLabel: formatDate(new Date().toISOString().slice(0, 10)),
      individualStandings: individualStandingsAll,
      teamStandings: teamStandingsAll,
      playerTimes: computePlayerPlayTime(completedWithDuration),
      teamTimes: computeTeamPlayTime(completedWithDuration),
      totalSeconds: totalPlaySeconds(completedWithDuration),
      playerName: name,
      teamName,
    })
  }

  // Renders the offscreen RankingReport (see JSX below), waits a frame for
  // it to paint (fonts/logo image), rasterizes it, then shares/downloads —
  // and always tears the offscreen node back down afterward.
  useEffect(() => {
    if (!reportProps) return
    let cancelled = false
    ;(async () => {
      await new Promise(requestAnimationFrame)
      try {
        const node = reportRef.current
        if (!node || cancelled) return
        const blob = await toBlob(node, { pixelRatio: 2, backgroundColor: '#152142' })
        if (!blob || cancelled) return
        const filename = `quase-profissionais-ranking-${new Date().toISOString().slice(0, 10)}.png`
        const file = new File([blob], filename, { type: 'image/png' })
        await shareOrDownloadFile(file, filename)
      } finally {
        if (!cancelled) {
          setReportProps(null)
          setSharing(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reportProps])

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">
        {t('Ranking')}
        <HelpHint
          text={t(
            'Classificação por Games Vencidos (GV) — quem fez mais games no total. Empate é decidido por Pontos Vencidos (PtV) e, se ainda empatar, por Partidas Vencidas (PV). O critério é o mesmo pro ranking Individual e por Dupla; a diferença é só quem entra na conta: Individual credita cada jogador separadamente, Dupla só soma quando os dois jogaram juntos como a mesma dupla.',
          )}
        />
      </h1>

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

      <button type="button" className={secondaryButton} disabled={sharing} onClick={handleShare}>
        {sharing ? t('Gerando...') : t('Compartilhar')}
      </button>

      {reportProps && (
        <div style={{ position: 'fixed', top: 0, left: -10000, zIndex: -1 }} aria-hidden="true">
          <div ref={reportRef}>
            <RankingReport {...reportProps} />
          </div>
        </div>
      )}

      {uneven && (
        <label className="flex items-center gap-2 text-sm text-cream/80">
          <input
            type="checkbox"
            className="h-5 w-5 accent-lime"
            checked={sameGamesOnly}
            onChange={() => setSameGamesOnly((v) => !v)}
          />
          <span>{t('Comparar só quem jogou o mesmo número de partidas')}</span>
        </label>
      )}

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
          {uneven && !sameGamesOnly && (
            <p className="text-xs text-gold">
              {t('Nem todos jogaram o mesmo número de partidas.')}
            </p>
          )}
          {sameGamesOnly && targetMatchesPlayed !== null && (
            <p className="text-xs text-gold">
              {t(
                mode === 'individual'
                  ? 'Mostrando {shown} de {total} jogadores, com {n} partidas cada.'
                  : 'Mostrando {shown} de {total} duplas, com {n} partidas cada.',
                { shown: rowCount, total: totalCount, n: targetMatchesPlayed },
              )}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-cream/60">
                  <th className="sticky left-0 z-10 w-8 bg-navy py-1 pr-2">#</th>
                  <th className="sticky left-8 z-10 bg-navy py-1 pr-2">
                    {t(mode === 'individual' ? 'Jogador' : 'Dupla')}
                  </th>
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
                        <td
                          className={`sticky left-0 z-10 w-8 bg-navy py-1 pr-2 ${i === 0 ? 'font-bold text-gold' : ''}`}
                        >
                          {i + 1}
                        </td>
                        <td
                          className={`sticky left-8 z-10 bg-navy py-1 pr-2 ${i === 0 ? 'font-bold text-gold' : ''}`}
                        >
                          {name(s.playerId)}
                        </td>
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
                        <td
                          className={`sticky left-0 z-10 w-8 bg-navy py-1 pr-2 ${i === 0 ? 'font-bold text-gold' : ''}`}
                        >
                          {i + 1}
                        </td>
                        <td
                          className={`sticky left-8 z-10 bg-navy py-1 pr-2 ${i === 0 ? 'font-bold text-gold' : ''}`}
                        >
                          {teamName(s.playerIds)}
                        </td>
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
              'Ordenado por GV, desempate por PtV e depois PV. PJ partidas jogadas · PV partidas vencidas · GV games vencidos · GP games perdidos · PtV pontos vencidos · PtP pontos perdidos',
            )}
            {mode === 'duplas' &&
              ` · ${t('Duplas: só conta quem jogou junto na mesma dupla.')}`}
          </p>
        </>
      )}
    </div>
  )
}
