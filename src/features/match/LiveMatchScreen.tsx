import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { cancelMatch, db, recordPoint, saveMatch, startMatch, undoLastPoint } from '../../db/db'
import { usePlayers, useSettings, useTournament } from '../../db/hooks'
import { computeMatchState } from '../../engine/score'
import type { CourtSide } from '../../engine/serve'
import type { PlayerId, TeamSide } from '../../engine/types'
import { ALERT_LABELS, computeAlerts } from './alerts'
import { computeServeInfo } from './serveInfo'
import { computeCourtSides } from './courtSide'
import { pointLabel } from './display'
import { ChangeEndsCourt } from './ChangeEndsCourt'
import { formatDuration } from '../../lib/format'
import { bigButton, bigButtonAlt, card, destructiveButton, secondaryButton } from '../../ui/styles'
import { useT } from '../../i18n/useT'
import type { Translator } from '../../i18n/i18n'
import { useVoiceAnnouncer } from '../voice/useVoiceAnnouncer'
import { useVoiceCommands } from '../voice/useVoiceCommands'
import { repeatLastAnnouncement } from '../voice/speech'

function sideLetter(t: Translator, side: CourtSide): string {
  return t(side)[0]
}

/** Small "D - E - D" trail below a team's card, one letter per side the team has occupied so far. */
function SideHistory({ history }: { history: CourtSide[] }) {
  const { t } = useT()
  return (
    <div
      className="mt-1 flex items-center justify-center gap-1 text-xs font-bold tabular-nums"
      aria-label={`${t('Histórico de lados:')} ${history.map((s) => t(s)).join(', ')}`}
    >
      {history.map((side, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-cream/30">-</span>}
          <span className={side === 'Direita' ? 'text-lime' : 'text-gold'}>
            {sideLetter(t, side)}
          </span>
        </span>
      ))}
    </div>
  )
}

interface Props {
  matchId: string
  onSaved: () => void
  onCancelled: () => void
}

export function LiveMatchScreen({ matchId, onSaved, onCancelled }: Props) {
  const { t, lang } = useT()
  const match = useLiveQuery(() => db.matches.get(matchId), [matchId])
  const tournament = useTournament(match?.tournamentId)
  const { byId } = usePlayers()
  const settings = useSettings()
  const [now, setNow] = useState(() => Date.now())
  const [saving, setSaving] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    startMatch(matchId)
  }, [matchId])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const name = (id: PlayerId) => byId.get(id)?.name ?? '?'
  const teamName = (ids: PlayerId[]) => ids.map(name).join(' & ')

  // Derived values are computed defensively (before the loading guard below)
  // so every hook in this component stays unconditional, per rules of hooks.
  const config = tournament?.options
  const state = match && config ? computeMatchState(match.pointLog, config) : undefined
  const alerts = state && config ? computeAlerts(state, config.deuceMode) : []
  const serveInfo = state && match ? computeServeInfo(state, match.serveOrder) : null
  const courtSidesForVoice =
    state && match ? computeCourtSides(state, match.team1InitialSide ?? 'Esquerda') : undefined

  // Brief pulse on the "Saca agora" banner whenever the server actually
  // changes, so a new server isn't just a silent text swap.
  const [serverPulse, setServerPulse] = useState(false)
  const prevServerId = useRef<PlayerId | undefined>(undefined)
  useEffect(() => {
    const current = serveInfo?.serverId
    if (current && prevServerId.current && prevServerId.current !== current) {
      setServerPulse(true)
      const t = setTimeout(() => setServerPulse(false), 700)
      prevServerId.current = current
      return () => clearTimeout(t)
    }
    prevServerId.current = current
  }, [serveInfo?.serverId])

  const voiceModeOn = settings?.voiceMode ?? false
  useVoiceCommands({
    enabled: voiceModeOn && !!state && !state.isMatchOver,
    lang,
    onTeam1: () => config && recordPoint(matchId, 'team1', config),
    onTeam2: () => config && recordPoint(matchId, 'team2', config),
    onRepeat: repeatLastAnnouncement,
  })
  useVoiceAnnouncer({
    enabled: voiceModeOn,
    lang,
    rate: settings?.voiceRate ?? 1,
    matchId,
    state,
    deuceMode: config?.deuceMode,
    alerts,
    serveInfo,
    serverName: serveInfo ? name(serveInfo.serverId) : '',
    courtSides: courtSidesForVoice,
    team1Name: match ? teamName(match.team1) : '',
    team2Name: match ? teamName(match.team2) : '',
  })

  if (!match || !tournament || !state || !config) {
    return <div className="p-4 text-cream/70">{t('Carregando partida...')}</div>
  }

  const elapsedSeconds = match.startedAt ? Math.floor((now - match.startedAt) / 1000) : 0
  const courtSides = courtSidesForVoice ?? computeCourtSides(state, match.team1InitialSide ?? 'Esquerda')

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

  const handleCancel = async () => {
    setCancelling(true)
    await cancelMatch(matchId)
    onCancelled()
  }

  // Team cards and point buttons are laid out left-to-right by physical
  // court side (not always Time 1 first), so whichever screen column shows
  // a team stays the column a spectator actually sees them standing in —
  // and both rows use the same order so the button lines up under its card.
  interface TeamSlot {
    key: TeamSide
    cardClass: string
    labelClass: string
    label: string
    name: string
    history: CourtSide[]
    button: ReactNode
  }
  const team1Slot: TeamSlot = {
    key: 'team1',
    cardClass: 'border-lime bg-lime/10',
    labelClass: 'text-lime',
    label: 'Time 1',
    name: teamName(match.team1),
    history: courtSides.team1History,
    button: (
      <button key="team1" type="button" className={bigButton} onClick={() => handlePoint('team1')}>
        {t('Ponto')} — {t('Time 1')}
      </button>
    ),
  }
  const team2Slot: TeamSlot = {
    key: 'team2',
    cardClass: 'border-cream bg-cream/10',
    labelClass: 'text-cream',
    label: 'Time 2',
    name: teamName(match.team2),
    history: courtSides.team2History,
    button: (
      <button
        key="team2"
        type="button"
        className={bigButtonAlt}
        onClick={() => handlePoint('team2')}
      >
        {t('Ponto')} — {t('Time 2')}
      </button>
    ),
  }
  const leftIsTeam1 = courtSides.team1 === 'Esquerda'
  const orderedSlots: TeamSlot[] = leftIsTeam1 ? [team1Slot, team2Slot] : [team2Slot, team1Slot]

  // The score display must follow the same left/right order as the team
  // cards and point buttons above and below it — it was previously always
  // showing team1's score on the left regardless of which side team1 was
  // actually standing on.
  const leftGamePoints = leftIsTeam1 ? state.currentGame.points1 : state.currentGame.points2
  const rightGamePoints = leftIsTeam1 ? state.currentGame.points2 : state.currentGame.points1
  const leftTiebreakPoints = leftIsTeam1 ? state.tiebreak.points1 : state.tiebreak.points2
  const rightTiebreakPoints = leftIsTeam1 ? state.tiebreak.points2 : state.tiebreak.points1
  const leftGames = leftIsTeam1 ? state.games1 : state.games2
  const rightGames = leftIsTeam1 ? state.games2 : state.games1

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between text-sm text-cream/60">
        <span className="tabular-nums">{formatDuration(elapsedSeconds)}</span>
        <span>
          {t('Rodada')} {match.roundIndex + 1}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        {orderedSlots.map((slot) => (
          <div key={slot.key} className={`${card} border-2 ${slot.cardClass}`}>
            <div className={`text-sm font-black uppercase tracking-wide ${slot.labelClass}`}>
              {t(slot.label)}
            </div>
            <div className="text-lg font-bold text-cream">{slot.name}</div>
            <SideHistory history={slot.history} />
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-col gap-1">
          {alerts.map((alert) =>
            alert === 'change-ends' ? (
              <div
                key={alert}
                className="rounded-lg border border-gold bg-gold/10 py-2 text-center text-lg font-bold text-gold"
              >
                {t(ALERT_LABELS[alert])}
                <ChangeEndsCourt />
              </div>
            ) : (
              <div
                key={alert}
                className="rounded-lg border border-gold bg-gold/10 py-2 text-center text-lg font-bold text-gold"
              >
                {t(ALERT_LABELS[alert])}
              </div>
            ),
          )}
        </div>
      )}

      <div className="rounded-2xl bg-navy-light py-6 text-center">
        {state.isTiebreak ? (
          <>
            <div className="text-sm font-semibold uppercase tracking-wide text-lime">
              {t('Tiebreak')}
            </div>
            <div className="text-7xl font-black tabular-nums">
              {leftTiebreakPoints} – {rightTiebreakPoints}
            </div>
          </>
        ) : (
          <div className="text-7xl font-black tabular-nums">
            {pointLabel(leftGamePoints, rightGamePoints, config.deuceMode)}
            {' – '}
            {pointLabel(rightGamePoints, leftGamePoints, config.deuceMode)}
          </div>
        )}
        <div className="mt-2 text-2xl font-semibold text-cream/80 tabular-nums">
          {t('Games:')} {leftGames} – {rightGames}
        </div>
      </div>

      {serveInfo && (
        <div
          data-testid="serve-banner"
          className={`rounded-xl border-l-4 border-lime bg-navy-light px-4 py-3 text-center text-xl font-bold text-cream ${
            serverPulse ? 'animate-serve-pulse' : ''
          }`}
        >
          <span aria-hidden="true">🎾</span> {t('Saca agora:')} {name(serveInfo.serverId)} —{' '}
          <span className={serveInfo.side === 'Direita' ? 'text-lime' : 'text-gold'}>
            {t(serveInfo.side)}
          </span>
        </div>
      )}

      {!state.isMatchOver ? (
        <div className="flex gap-3">{orderedSlots.map((slot) => slot.button)}</div>
      ) : (
        <div className={card}>
          <h2 className="mb-2 text-xl font-bold">{t('Resultado final')}</h2>
          <p className="text-lg font-semibold">
            {teamName(match.team1)} {state.finalGames1} × {state.finalGames2}{' '}
            {teamName(match.team2)}
          </p>
          <p className="text-sm text-cream/70">
            {t('Pontos:')} {match.points1} – {match.points2} · {t('Duração:')}{' '}
            {formatDuration(elapsedSeconds)}
          </p>
          <button
            type="button"
            className={`${bigButton} mt-3 w-full`}
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? t('Salvando...') : t('Salvar partida')}
          </button>
        </div>
      )}

      {confirmingCancel ? (
        <div className={`${card} border border-destructive/50`}>
          <p className="mb-3 text-sm text-destructive">
            {t(
              '⚠ Cancelar esta partida? Os pontos jogados até agora serão perdidos e você vai precisar configurar a partida de novo (ordem de saque e lado). Isso não pode ser desfeito.',
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={secondaryButton}
              onClick={() => setConfirmingCancel(false)}
            >
              {t('Voltar')}
            </button>
            <button
              type="button"
              className={`${destructiveButton} flex-1`}
              disabled={cancelling}
              onClick={handleCancel}
            >
              {cancelling ? t('Cancelando...') : t('Sim, cancelar partida')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            className={`${secondaryButton} flex-1`}
            disabled={match.pointLog.length === 0}
            onClick={handleUndo}
          >
            {t('Desfazer')}
          </button>
          <button type="button" className={secondaryButton} onClick={() => setConfirmingCancel(true)}>
            {t('Cancelar partida')}
          </button>
        </div>
      )}
    </div>
  )
}
