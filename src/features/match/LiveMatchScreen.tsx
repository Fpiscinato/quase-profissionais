import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, recordPoint, saveMatch, startMatch, undoLastPoint } from '../../db/db'
import { usePlayers, useTournament } from '../../db/hooks'
import { computeMatchState } from '../../engine/score'
import type { PlayerId, TeamSide } from '../../engine/types'
import { ALERT_LABELS, computeAlerts } from './alerts'
import { computeServeInfo } from './serveInfo'
import { pointLabel } from './display'
import { formatDuration } from '../../lib/format'
import { bigButton, card, secondaryButton } from '../../ui/styles'

interface Props {
  matchId: string
  onSaved: () => void
}

export function LiveMatchScreen({ matchId, onSaved }: Props) {
  const match = useLiveQuery(() => db.matches.get(matchId), [matchId])
  const tournament = useTournament(match?.tournamentId)
  const { byId } = usePlayers()
  const [now, setNow] = useState(() => Date.now())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    startMatch(matchId)
  }, [matchId])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!match || !tournament) {
    return <div className="p-4 text-cream/70">Carregando partida...</div>
  }

  const config = tournament.options
  const state = computeMatchState(match.pointLog, config)
  const alerts = computeAlerts(state, config.deuceMode)
  const serveInfo = computeServeInfo(state, match.serveOrder)
  const elapsedSeconds = match.startedAt ? Math.floor((now - match.startedAt) / 1000) : 0

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'
  const teamName = (ids: PlayerId[]) => ids.map(name).join(' & ')

  const handlePoint = (side: TeamSide) => {
    recordPoint(matchId, side, config)
  }

  const handleUndo = () => {
    undoLastPoint(matchId, config)
  }

  const handleSave = async () => {
    setSaving(true)
    await saveMatch(matchId)
    onSaved()
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between text-sm text-cream/60">
        <span className="tabular-nums">{formatDuration(elapsedSeconds)}</span>
        <span>Rodada {match.roundIndex + 1}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className={card}>
          <div className="text-xs text-cream/60">Time 1</div>
          <div className="text-lg font-bold">{teamName(match.team1)}</div>
        </div>
        <div className={card}>
          <div className="text-xs text-cream/60">Time 2</div>
          <div className="text-lg font-bold">{teamName(match.team2)}</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-col gap-1">
          {alerts.map((alert) => (
            <div
              key={alert}
              className="rounded-lg border border-gold bg-gold/10 py-2 text-center text-lg font-bold text-gold"
            >
              {ALERT_LABELS[alert]}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-navy-light py-6 text-center">
        {state.isTiebreak ? (
          <>
            <div className="text-sm font-semibold uppercase tracking-wide text-lime">
              Tiebreak
            </div>
            <div className="text-7xl font-black tabular-nums">
              {state.tiebreak.points1} – {state.tiebreak.points2}
            </div>
          </>
        ) : (
          <div className="text-7xl font-black tabular-nums">
            {pointLabel(state.currentGame.points1, state.currentGame.points2, config.deuceMode)}
            {' – '}
            {pointLabel(state.currentGame.points2, state.currentGame.points1, config.deuceMode)}
          </div>
        )}
        <div className="mt-2 text-2xl font-semibold text-cream/80 tabular-nums">
          Games: {state.games1} – {state.games2}
        </div>
      </div>

      {serveInfo && (
        <div className="rounded-xl bg-lime px-4 py-3 text-center text-xl font-bold text-navy">
          Saca agora: {name(serveInfo.serverId)} — {serveInfo.side}
        </div>
      )}

      {!state.isMatchOver ? (
        <div className="flex gap-3">
          <button type="button" className={bigButton} onClick={() => handlePoint('team1')}>
            Ponto — Time 1
          </button>
          <button type="button" className={bigButton} onClick={() => handlePoint('team2')}>
            Ponto — Time 2
          </button>
        </div>
      ) : (
        <div className={card}>
          <h2 className="mb-2 text-xl font-bold">Resultado final</h2>
          <p className="text-lg font-semibold">
            {teamName(match.team1)} {state.finalGames1} × {state.finalGames2}{' '}
            {teamName(match.team2)}
          </p>
          <p className="text-sm text-cream/70">
            Pontos: {match.points1} – {match.points2} · Duração: {formatDuration(elapsedSeconds)}
          </p>
          <button
            type="button"
            className={`${bigButton} mt-3 w-full`}
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? 'Salvando...' : 'Salvar partida'}
          </button>
        </div>
      )}

      <button
        type="button"
        className={secondaryButton}
        disabled={match.pointLog.length === 0}
        onClick={handleUndo}
      >
        Desfazer
      </button>
    </div>
  )
}
