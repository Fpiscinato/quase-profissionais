import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, deleteDay, deleteTournament } from '../../db/db'
import type { TournamentRow } from '../../db/db'
import { usePlayers } from '../../db/hooks'
import { computePlayerPlayTime, computeTeamPlayTime, totalPlaySeconds } from '../../engine/stats'
import type { PlayerId } from '../../engine/types'
import { formatDate, formatDuration, formatHoursMinutes } from '../../lib/format'
import { card, destructiveButton, secondaryButton } from '../../ui/styles'
import { useT } from '../../i18n/useT'

export function HistoryScreen() {
  const { t } = useT()
  const tournaments = useLiveQuery(
    () => db.tournaments.orderBy('createdAt').reverse().toArray(),
    [],
    [],
  )
  const matches = useLiveQuery(() => db.matches.toArray(), [], [])
  const { byId } = usePlayers()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteDay, setConfirmDeleteDay] = useState<string | null>(null)
  const [deletingDay, setDeletingDay] = useState(false)

  const handleDelete = async (tournamentId: string) => {
    await deleteTournament(tournamentId)
    setConfirmDeleteId(null)
  }

  const handleDeleteDay = async (date: string) => {
    setDeletingDay(true)
    await deleteDay(date)
    setConfirmDeleteDay(null)
    setDeletingDay(false)
  }

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'
  const teamName = (ids: PlayerId[]) => ids.map(name).sort((a, b) => a.localeCompare(b, 'pt-BR')).join(' & ')

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (tournaments.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">{t('Histórico')}</h1>
        <p className="mt-2 text-sm text-cream/70">{t('Nenhum torneio registrado ainda.')}</p>
      </div>
    )
  }

  const completedMatches = matches
    .filter((m) => m.status === 'completed')
    .map((m) => ({ ...m, durationSeconds: m.durationSeconds ?? 0 }))
  const playerTimes = computePlayerPlayTime(completedMatches)
  const teamTimes = computeTeamPlayTime(completedMatches).filter((t) => t.playerIds.length === 2)

  // "Partida avulsa" means a single day can have several tournament rows
  // (the main one plus one-off matches), so group by date to offer a
  // one-shot "excluir o dia" alongside the existing per-tournament delete.
  const dayGroups: { date: string; tournaments: TournamentRow[] }[] = []
  const dayGroupIndex = new Map<string, number>()
  for (const tournament of tournaments) {
    const existingIndex = dayGroupIndex.get(tournament.date)
    if (existingIndex === undefined) {
      dayGroupIndex.set(tournament.date, dayGroups.length)
      dayGroups.push({ date: tournament.date, tournaments: [tournament] })
    } else {
      dayGroups[existingIndex].tournaments.push(tournament)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">{t('Histórico')}</h1>

      <div className={card}>
        <h2 className="mb-2 font-semibold">{t('Tempo jogado (todos os torneios)')}</h2>
        <p className="mb-3 text-lg font-bold text-lime">
          {formatHoursMinutes(totalPlaySeconds(completedMatches))}
        </p>

        {playerTimes.length > 0 && (
          <>
            <div className="mb-1 text-xs font-semibold text-cream/60">{t('Por jogador')}</div>
            <ul className="mb-3 flex flex-col gap-1 text-sm">
              {playerTimes.map((pt) => (
                <li key={pt.playerId} className="flex justify-between">
                  <span>{name(pt.playerId)}</span>
                  <span className="text-cream/70">
                    {formatHoursMinutes(pt.totalSeconds)} · {pt.matchesPlayed}{' '}
                    {t(pt.matchesPlayed > 1 ? 'partidas' : 'partida')}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {teamTimes.length > 0 && (
          <>
            <div className="mb-1 text-xs font-semibold text-cream/60">{t('Por dupla')}</div>
            <ul className="flex flex-col gap-1 text-sm">
              {teamTimes.map((tt) => (
                <li key={tt.playerIds.join('|')} className="flex justify-between">
                  <span>{teamName(tt.playerIds)}</span>
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

      <div className="flex flex-col gap-4">
        {dayGroups.map((group) => (
          <div key={group.date} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-cream/80">{formatDate(group.date)}</h2>
              {confirmDeleteDay !== group.date && (
                <button
                  type="button"
                  className={`${secondaryButton} text-xs`}
                  onClick={() => setConfirmDeleteDay(group.date)}
                >
                  {t('Excluir dia')}
                </button>
              )}
            </div>

            {confirmDeleteDay === group.date && (
              <div className={`${card} border border-destructive/50`}>
                <p className="mb-2 text-xs text-destructive">
                  {t(
                    '⚠ Excluir o dia todo — todos os torneios e partidas dessa data? Essa ação não pode ser desfeita.',
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={secondaryButton}
                    onClick={() => setConfirmDeleteDay(null)}
                  >
                    {t('Cancelar')}
                  </button>
                  <button
                    type="button"
                    className={`${destructiveButton} flex-1`}
                    disabled={deletingDay}
                    onClick={() => handleDeleteDay(group.date)}
                  >
                    {deletingDay ? t('Excluindo...') : t('Sim, excluir dia')}
                  </button>
                </div>
              </div>
            )}

            {group.tournaments.map((tournament) => {
              const tournamentMatches = matches
                .filter((m) => m.tournamentId === tournament.id && m.status === 'completed')
                .sort((a, b) => a.roundIndex - b.roundIndex)
              const isOpen = expanded.has(tournament.id)

              return (
                <div key={tournament.id} className={card}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => toggle(tournament.id)}
                  >
                    <div>
                      <div className="font-semibold">
                        {t(tournament.format === 'duplas' ? 'Duplas (Americano)' : 'Individual')}
                      </div>
                      <div className="text-xs text-cream/60">
                        {tournamentMatches.length}/{tournament.rounds.length}{' '}
                        {t(tournament.rounds.length > 1 ? 'partidas' : 'partida')}{' '}
                        {t(tournamentMatches.length !== 1 ? 'concluídas' : 'concluída')}
                      </div>
                    </div>
                    <span className="text-cream/50">{isOpen ? '▲' : '▼'}</span>
                  </button>

              {isOpen && (
                <div className="mt-3 flex flex-col gap-2 border-t border-cream/10 pt-3">
                  {tournamentMatches.length === 0 && (
                    <p className="text-sm text-cream/60">{t('Nenhuma partida concluída.')}</p>
                  )}
                  {tournamentMatches.map((match) => (
                    <div key={match.id} className="rounded-lg bg-navy px-3 py-2 text-sm">
                      <div className="text-xs text-cream/60">
                        {t('Rodada')} {match.roundIndex + 1}
                      </div>
                      <div>
                        <span className={match.winnerTeam === 'team1' ? 'font-bold text-lime' : ''}>
                          {teamName(match.team1)}
                        </span>{' '}
                        {match.games1} × {match.games2}{' '}
                        <span className={match.winnerTeam === 'team2' ? 'font-bold text-lime' : ''}>
                          {teamName(match.team2)}
                        </span>
                      </div>
                      <div className="text-xs text-cream/60">
                        {t('Pontos:')} {match.points1} – {match.points2} · {t('Duração:')}{' '}
                        {formatDuration(match.durationSeconds ?? 0)}
                      </div>
                    </div>
                  ))}

                  {confirmDeleteId === tournament.id ? (
                    <div className="flex flex-col gap-2 border-t border-cream/10 pt-2">
                      <p className="text-xs text-destructive">
                        {t(
                          '⚠ Excluir este torneio e todas as suas partidas do histórico e do ranking? Essa ação não pode ser desfeita.',
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={secondaryButton}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          {t('Cancelar')}
                        </button>
                        <button
                          type="button"
                          className={`${destructiveButton} flex-1`}
                          onClick={() => handleDelete(tournament.id)}
                        >
                          {t('Sim, excluir')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`${secondaryButton} self-start`}
                      onClick={() => setConfirmDeleteId(tournament.id)}
                    >
                      {t('Excluir torneio')}
                    </button>
                  )}
                </div>
              )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
