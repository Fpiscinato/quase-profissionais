import type { PlayerPlayTime, TeamPlayTime } from '../../engine/stats'
import type { PlayerId, PlayerStanding, TeamStanding } from '../../engine/types'
import { formatHoursMinutes } from '../../lib/format'
import { card } from '../../ui/styles'
import { useT } from '../../i18n/useT'
import { APP_VERSION } from '../../version'
import { groupByMatchesPlayed } from './rankingFilter'

export interface RankingReportProps {
  scopeLabel: string
  generatedAtLabel: string
  individualStandings: PlayerStanding[]
  teamStandings: TeamStanding[]
  /** Mirrors the "Agrupar por número de partidas jogadas" checkbox state on RankingScreen at the moment Compartilhar was tapped. */
  groupByMatches: boolean
  playerTimes: PlayerPlayTime[]
  teamTimes: TeamPlayTime[]
  totalSeconds: number
  playerName: (id: PlayerId) => string
  teamName: (ids: PlayerId[]) => string
}

const headCell = 'py-2 pr-3 text-left text-xs font-semibold text-cream/60'
const headCellRight = 'py-2 pr-3 text-right text-xs font-semibold text-cream/60'
const cell = 'py-2 pr-3'
const cellRight = 'py-2 pr-3 text-right'

/**
 * Purely presentational — no Dexie/hooks for data, everything comes in as
 * props already computed by RankingScreen. Rendered off-screen at a fixed
 * generous width (see RankingScreen's capture flow) so html-to-image gets a
 * layout that never depends on the sticky/scroll tricks the on-screen table
 * needs to fit a phone.
 */
export function RankingReport(props: RankingReportProps) {
  const { t } = useT()

  return (
    <div className="flex w-[1080px] flex-col gap-6 bg-navy p-10 text-cream" style={{ fontFamily: 'sans-serif' }}>
      <div className="flex items-center gap-4 border-b border-cream/10 pb-6">
        <img src="/logo.png" alt="" className="h-16 w-16 rounded-full object-cover" />
        <div>
          <div className="text-2xl font-bold">{t('Os Quase Profissionais')}</div>
          <div className="text-lg text-lime">{props.scopeLabel}</div>
        </div>
      </div>

      <RankingTable
        title={t('Individual')}
        head={['#', t('Jogador'), t('PJ'), t('PV'), t('GV'), t('GP'), t('PtV'), t('PtP')]}
        standings={props.individualStandings}
        groupByMatches={props.groupByMatches}
        rowKey={(s) => s.playerId}
        rowValues={(s) => [
          props.playerName(s.playerId),
          String(s.matchesPlayed),
          String(s.matchesWon),
          String(s.gamesWon),
          String(s.gamesLost),
          String(s.pointsWon),
          String(s.pointsLost),
        ]}
      />

      <RankingTable
        title={t('Duplas')}
        head={['#', t('Dupla'), t('PJ'), t('PV'), t('GV'), t('GP'), t('PtV'), t('PtP')]}
        standings={props.teamStandings}
        groupByMatches={props.groupByMatches}
        rowKey={(s) => s.playerIds.join('|')}
        rowValues={(s) => [
          props.teamName(s.playerIds),
          String(s.matchesPlayed),
          String(s.matchesWon),
          String(s.gamesWon),
          String(s.gamesLost),
          String(s.pointsWon),
          String(s.pointsLost),
        ]}
      />

      <div className={card}>
        <h2 className="mb-2 text-lg font-semibold">{t('Tempo jogado (todos os torneios)')}</h2>
        <p className="mb-3 text-2xl font-bold text-lime">{formatHoursMinutes(props.totalSeconds)}</p>

        {props.playerTimes.length > 0 && (
          <>
            <div className="mb-1 text-sm font-semibold text-cream/60">{t('Por jogador')}</div>
            <ul className="mb-3 flex flex-col gap-1 text-base">
              {props.playerTimes.map((pt) => (
                <li key={pt.playerId} className="flex justify-between">
                  <span>{props.playerName(pt.playerId)}</span>
                  <span className="text-cream/70">
                    {formatHoursMinutes(pt.totalSeconds)} · {pt.matchesPlayed}{' '}
                    {t(pt.matchesPlayed > 1 ? 'partidas' : 'partida')}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {props.teamTimes.length > 0 && (
          <>
            <div className="mb-1 text-sm font-semibold text-cream/60">{t('Por dupla')}</div>
            <ul className="flex flex-col gap-1 text-base">
              {props.teamTimes.map((tt) => (
                <li key={tt.playerIds.join('|')} className="flex justify-between">
                  <span>{props.teamName(tt.playerIds)}</span>
                  <span className="text-cream/70">
                    {formatHoursMinutes(tt.totalSeconds)} · {tt.matchesPlayed}{' '}
                    {t(tt.matchesPlayed > 1 ? 'partidas' : 'partida')}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="text-center text-xs text-cream/40">
        {t('Gerado por Os Quase Profissionais')} · v{APP_VERSION} · {props.generatedAtLabel}
      </div>
    </div>
  )
}

interface RankingTableProps<T extends { matchesPlayed: number }> {
  title: string
  head: string[]
  standings: T[]
  groupByMatches: boolean
  rowKey: (s: T) => string
  rowValues: (s: T) => string[]
}

function RankingTable<T extends { matchesPlayed: number }>({
  title,
  head,
  standings,
  groupByMatches,
  rowKey,
  rowValues,
}: RankingTableProps<T>) {
  const { t } = useT()
  const sections = groupByMatches
    ? groupByMatchesPlayed(standings)
    : [{ matchesPlayed: null as number | null, rows: standings }]

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {standings.length === 0 ? (
        <p className="text-sm text-cream/50">—</p>
      ) : (
        sections.map((section) => (
          <div key={section.matchesPlayed ?? 'all'} className={section.matchesPlayed !== null ? 'mt-4' : ''}>
            {section.matchesPlayed !== null && (
              <div className="mb-1 text-xs font-semibold text-cream/50">
                {section.matchesPlayed} {t(section.matchesPlayed > 1 ? 'partidas' : 'partida')}
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {head.map((h, i) => (
                    <th key={h} className={i >= 2 ? headCellRight : headCell}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((s, i) => (
                  <tr key={rowKey(s)} className={i === 0 ? 'font-bold text-gold' : ''}>
                    <td className={cell}>{i + 1}</td>
                    {rowValues(s).map((value, j) => (
                      <td key={j} className={j >= 1 ? cellRight : cell}>
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
