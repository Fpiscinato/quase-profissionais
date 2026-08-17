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
import { useT } from '../../i18n/useT'
import { HelpHint } from '../../ui/HelpHint'
import { groupByMatchesPlayed } from './rankingFilter'
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

/**
 * When `grouped` is false, everything renders as a single section (no
 * header row) — same flat list as before the "mesmo número de partidas"
 * feature existed. When true, splits via groupByMatchesPlayed so nobody is
 * hidden, just organized into fair, separately-numbered comparison groups.
 */
function sectionsFor<T extends { matchesPlayed: number }>(
  standings: T[],
  grouped: boolean,
): { matchesPlayed: number | null; rows: T[] }[] {
  if (!grouped) return [{ matchesPlayed: null, rows: standings }]
  return groupByMatchesPlayed(standings)
}

// Smaller than the shared toggleButton/secondaryButton (ui/styles.ts) —
// this screen packs in a lot of controls (tab, mode, filters, share) above
// a table that itself needs vertical room, so these trade a little tap-
// target size for fitting more of the table without scrolling the page.
const compactToggle = (active: boolean) =>
  `min-h-9 flex-1 rounded-lg px-2 py-1 text-sm font-semibold border-2 transition-colors ${
    active ? 'border-lime bg-lime/10 text-lime' : 'border-cream/20 text-cream/70'
  }`

// Standard "share" glyph (box with an arrow pointing up and out) — reads
// as a share action at a glance without needing a label, so the button
// next to "Ranking" can stay small.
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V4M12 4L7 9M12 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Alternating row tint so the grid doesn't read as one flat block of color
// — applied to both the sticky (#/name) and regular cells of a row via the
// SAME single class (never layered with bg-navy on the same element: two
// background utilities on one element race on Tailwind's generated rule
// order, not class order, so only one of the two backgrounds would win).
// Fully opaque (no /alpha) on purpose — a translucent stripe on the sticky
// #/name cells let the PJ/PV/... text scrolling underneath show through
// during a horizontal scroll, which read as "numbers on top of the names".
const rowBg = (i: number) => (i % 2 === 1 ? 'bg-[#1a2650]' : 'bg-navy')

export function RankingScreen() {
  const { t } = useT()
  const [tab, setTab] = useState<Tab>('dia')
  const [mode, setMode] = useState<Mode>('individual')
  const [sameGamesOnly, setSameGamesOnly] = useState(false)
  const [tournamentOnly, setTournamentOnly] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const { byId } = usePlayers()

  const tournaments = useLiveQuery(() => db.tournaments.toArray(), [], [])
  const allCompletedMatchesRaw = useLiveQuery(
    () => db.matches.where('status').equals('completed').toArray(),
    [],
    [],
  )

  const tournamentDateById = new Map(tournaments.map((tour) => [tour.id, tour.date]))
  // Absent on tournaments created before this field existed — treated as
  // 'torneio' so old data keeps counting exactly as it did before, both when
  // the filter is off and (as a reasonable default) when it's on.
  const tournamentOriginById = new Map(tournaments.map((tour) => [tour.id, tour.origin ?? 'torneio']))
  const allCompletedMatches = tournamentOnly
    ? allCompletedMatchesRaw.filter((m) => tournamentOriginById.get(m.tournamentId) !== 'avulsa')
    : allCompletedMatchesRaw

  // Distinct dates that actually have a completed match, most recent first —
  // "Ranking do dia" used to mean "the most recently created tournament",
  // which silently missed earlier same-day matches (e.g. several separate
  // Partidas avulsas) and kept showing yesterday's data forever once no new
  // tournament had been created yet today. Scoping by date instead (same
  // field HistoryScreen already groups by) fixes both: it sums every match
  // from a given day, and defaults to the most recent day actually played.
  const availableDates = Array.from(
    new Set(
      allCompletedMatches
        .map((m) => tournamentDateById.get(m.tournamentId))
        .filter((d): d is string => !!d),
    ),
  ).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
  const effectiveDate = selectedDate ?? availableDates[0] ?? null

  const matchesForTab =
    tab === 'dia'
      ? allCompletedMatches.filter((m) => tournamentDateById.get(m.tournamentId) === effectiveDate)
      : allCompletedMatches
  const matchResults = matchesForTab.map(toMatchResult)

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'
  const teamName = (ids: PlayerId[]) =>
    ids.map(name).sort((a, b) => a.localeCompare(b, 'pt-BR')).join(' & ')

  const individualStandings = computeStandings(matchResults)
  // Individual-format matches produce 1-player "teams" (computeTeamStandings
  // credits any team, singles included) — filtered out here so "Duplas"
  // only ever shows real pairs, matching the note below the table and the
  // same filter HistoryScreen.tsx already applies to its "Por dupla" stats.
  const teamStandings = computeTeamStandings(matchResults).filter((s) => s.playerIds.length === 2)
  const uneven =
    mode === 'individual'
      ? individualStandings.some((s) => s.matchesPlayed !== individualStandings[0]?.matchesPlayed)
      : teamStandings.some((s) => s.matchesPlayed !== teamStandings[0]?.matchesPlayed)

  const rowCount = mode === 'individual' ? individualStandings.length : teamStandings.length

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
          ? effectiveDate
            ? `${t('Ranking do dia')} — ${formatDate(effectiveDate)}`
            : t('Ranking do dia')
          : t('Ranking geral'),
      generatedAtLabel: formatDate(new Date().toISOString().slice(0, 10)),
      individualStandings,
      teamStandings,
      groupByMatches: sameGamesOnly,
      playerTimes: computePlayerPlayTime(completedWithDuration),
      teamTimes: computeTeamPlayTime(completedWithDuration).filter((t) => t.playerIds.length === 2),
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

  const groupLabel = (matchesPlayed: number) =>
    `${matchesPlayed} ${t(matchesPlayed > 1 ? 'partidas' : 'partida')}`

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {t('Ranking')}
          <HelpHint
            text={t(
              'Classificação por Games Vencidos (GV) — quem fez mais games no total. Empate é decidido por Pontos Vencidos (PtV) e, se ainda empatar, por Partidas Vencidas (PV). O critério é o mesmo pro ranking Individual e por Dupla; a diferença é só quem entra na conta: Individual credita cada jogador separadamente, Dupla só soma quando os dois jogaram juntos como a mesma dupla.',
            )}
          />
        </h1>
        <button
          type="button"
          disabled={sharing}
          onClick={handleShare}
          className="flex h-9 items-center gap-1 rounded-full border border-cream/30 px-3 text-xs font-semibold text-cream disabled:opacity-40 active:bg-white/10"
        >
          <ShareIcon />
          {t('Compartilhar')}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setTab('dia')} className={compactToggle(tab === 'dia')}>
          {t('Do dia')}
        </button>
        <button type="button" onClick={() => setTab('geral')} className={compactToggle(tab === 'geral')}>
          {t('Geral')}
        </button>
        {tab === 'dia' && availableDates.length > 1 && (
          <select
            aria-label={t('Ranking do dia')}
            value={effectiveDate ?? ''}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="min-h-9 shrink-0 rounded-lg border border-cream/20 bg-navy px-2 text-sm text-cream"
          >
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {formatDate(d)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('individual')}
          className={compactToggle(mode === 'individual')}
        >
          {t('Individual')}
        </button>
        <button
          type="button"
          onClick={() => setMode('duplas')}
          className={compactToggle(mode === 'duplas')}
        >
          {t('Duplas')}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-cream/80">
        <input
          type="checkbox"
          className="h-5 w-5 accent-lime"
          checked={tournamentOnly}
          onChange={() => setTournamentOnly((v) => !v)}
        />
        <span>{t('Somente partidas de torneio')}</span>
      </label>

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
          <span>{t('Agrupar por número de partidas jogadas')}</span>
        </label>
      )}

      {rowCount === 0 ? (
        <p className="text-sm text-cream/70">{t('Nenhuma partida concluída ainda.')}</p>
      ) : (
        <>
          {uneven && !sameGamesOnly && (
            <p className="text-xs text-gold">
              {t('Nem todos jogaram o mesmo número de partidas.')}
            </p>
          )}
          {/* The fade on the right edge is a constant hint that the table
              scrolls horizontally — on a phone the scrollbar itself is
              usually invisible (iOS/Android hide it by default), and with
              every column filled in the same navy the grid gave no visual
              cue that PtV/PtP were off-screen until you scrolled by accident.

              This used to be built from `display: contents` div "rows" over
              CSS Grid (to dodge a Chromium bug where `colspan` breaks sticky
              on real <td>s — worked around below by splitting each group
              header into two non-colspan sticky cells + a colspan filler).
              But `display: contents` has its own real bug in WebKit: a
              `position: sticky` descendant of a `display: contents` box can
              resolve the wrong containing block, so instead of sticking to
              this scroll container it can appear pinned to the viewport —
              exactly the "primeira linha congelada" report. A plain <table>
              has no such issue (sticky <td>/<th> is the standard, reliable
              way to freeze table columns), so this reverts to one. */}
          <div className="relative">
            <div className="overflow-x-auto">
              <table className="min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-navy py-1 pr-2 text-left font-normal text-cream/60">
                      #
                    </th>
                    <th className="sticky left-8 z-10 bg-navy py-1 pr-2 text-left font-normal text-cream/60">
                      {t(mode === 'individual' ? 'Jogador' : 'Dupla')}
                    </th>
                    <th className="py-1 pr-2 text-right font-normal text-cream/60">{t('PJ')}</th>
                    <th className="py-1 pr-2 text-right font-normal text-cream/60">{t('PV')}</th>
                    <th className="py-1 pr-2 text-right font-normal text-cream/60">{t('GV')}</th>
                    <th className="py-1 pr-2 text-right font-normal text-cream/60">{t('GP')}</th>
                    <th className="py-1 pr-2 text-right font-normal text-cream/60">{t('PtV')}</th>
                    <th className="py-1 text-right font-normal text-cream/60">{t('PtP')}</th>
                  </tr>
                </thead>
                <tbody>
                  {mode === 'individual'
                    ? sectionsFor(individualStandings, sameGamesOnly).flatMap((section) => {
                        const rows = section.rows.map((s, i) => {
                          const cell = `${rowBg(i)} ${i === 0 ? 'font-bold text-gold' : ''}`
                          return (
                            <tr key={s.playerId}>
                              <td className={`sticky left-0 z-10 ${cell} py-1 pr-2`}>{i + 1}</td>
                              <td className={`sticky left-8 z-10 whitespace-nowrap ${cell} py-1 pr-2`}>
                                {name(s.playerId)}
                              </td>
                              <td className={`${cell} py-1 pr-2 text-right`}>{s.matchesPlayed}</td>
                              <td className={`${cell} py-1 pr-2 text-right`}>{s.matchesWon}</td>
                              <td className={`${cell} py-1 pr-2 text-right`}>{s.gamesWon}</td>
                              <td className={`${cell} py-1 pr-2 text-right`}>{s.gamesLost}</td>
                              <td className={`${cell} py-1 pr-2 text-right`}>{s.pointsWon}</td>
                              <td className={`${cell} py-1 text-right`}>{s.pointsLost}</td>
                            </tr>
                          )
                        })
                        if (section.matchesPlayed === null) return rows
                        return [
                          <tr key={`group-${section.matchesPlayed}`}>
                            <td className="sticky left-0 z-10 bg-navy pt-3 pb-1" />
                            <td className="sticky left-8 z-10 whitespace-nowrap bg-navy pt-3 pb-1 text-xs font-semibold text-cream/50">
                              {groupLabel(section.matchesPlayed)}
                            </td>
                            <td className="bg-navy pt-3 pb-1" colSpan={6} />
                          </tr>,
                          ...rows,
                        ]
                      })
                    : sectionsFor(teamStandings, sameGamesOnly).flatMap((section) => {
                        const rows = section.rows.map((s, i) => {
                          const cell = `${rowBg(i)} ${i === 0 ? 'font-bold text-gold' : ''}`
                          return (
                            <tr key={s.playerIds.join('|')}>
                              <td className={`sticky left-0 z-10 ${cell} py-1 pr-2`}>{i + 1}</td>
                              <td className={`sticky left-8 z-10 whitespace-nowrap ${cell} py-1 pr-2`}>
                                {teamName(s.playerIds)}
                              </td>
                              <td className={`${cell} py-1 pr-2 text-right`}>{s.matchesPlayed}</td>
                              <td className={`${cell} py-1 pr-2 text-right`}>{s.matchesWon}</td>
                              <td className={`${cell} py-1 pr-2 text-right`}>{s.gamesWon}</td>
                              <td className={`${cell} py-1 pr-2 text-right`}>{s.gamesLost}</td>
                              <td className={`${cell} py-1 pr-2 text-right`}>{s.pointsWon}</td>
                              <td className={`${cell} py-1 text-right`}>{s.pointsLost}</td>
                            </tr>
                          )
                        })
                        if (section.matchesPlayed === null) return rows
                        return [
                          <tr key={`group-${section.matchesPlayed}`}>
                            <td className="sticky left-0 z-10 bg-navy pt-3 pb-1" />
                            <td className="sticky left-8 z-10 whitespace-nowrap bg-navy pt-3 pb-1 text-xs font-semibold text-cream/50">
                              {groupLabel(section.matchesPlayed)}
                            </td>
                            <td className="bg-navy pt-3 pb-1" colSpan={6} />
                          </tr>,
                          ...rows,
                        ]
                      })}
                </tbody>
              </table>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-navy/70 to-transparent" />
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
