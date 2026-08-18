import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  cancelMatch,
  db,
  recordPoint,
  saveMatch,
  startMatch,
  undoLastPoint,
  updateSettings,
} from '../../db/db'
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
import { useWakeLock } from '../../lib/useWakeLock'
import { useKeyCommands } from '../keys/useKeyCommands'
import { useMatchMedia } from '../../lib/useMatchMedia'
import {
  LAYOUT_MODE_LABELS,
  nextLayoutMode,
  resolveEffectiveLayout,
  TABLET_MIN_HEIGHT_QUERY,
  TABLET_MIN_WIDTH_QUERY,
  TABLET_ROOMY_MIN_WIDTH_QUERY,
} from './layoutMode'

function sideLetter(t: Translator, side: CourtSide): string {
  return t(side)[0]
}

/** Caps how many D/E letters actually render (see SideHistory) — a long tiebreak swaps ends every
 * few points, so the full trail can run past what a team card's width can hold on a phone. */
const MAX_VISIBLE_SIDE_HISTORY = 5

/**
 * Small "D - E - D" trail below a team's card, one letter per side the team
 * has occupied so far. Only the most recent MAX_VISIBLE_SIDE_HISTORY entries
 * are shown (a "…" marks that older ones were trimmed) — the full history is
 * still exposed via aria-label for screen readers/tests.
 */
function SideHistory({ history }: { history: CourtSide[] }) {
  const { t } = useT()
  const visible = history.slice(-MAX_VISIBLE_SIDE_HISTORY)
  const truncated = visible.length < history.length
  return (
    <div
      className="mt-1 flex items-center justify-center gap-1 text-xs font-bold tabular-nums"
      aria-label={`${t('Histórico de lados:')} ${history.map((s) => t(s)).join(', ')}`}
    >
      {truncated && <span className="text-cream/30">…</span>}
      {visible.map((side, i) => (
        <span key={i} className="flex items-center gap-1">
          {(i > 0 || truncated) && <span className="text-cream/30">-</span>}
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

  // Kept on for the whole match, independent of voice mode — a dimmed/locked
  // screen is the likely cause of voice commands cancelling mid-match, and
  // staying lit is useful either way.
  useWakeLock(true)

  const isWideViewport = useMatchMedia(TABLET_MIN_WIDTH_QUERY)
  const isTallViewport = useMatchMedia(TABLET_MIN_HEIGHT_QUERY)
  const isRoomyWidth = useMatchMedia(TABLET_ROOMY_MIN_WIDTH_QUERY)

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
  const voiceCommandsOn = settings?.voiceCommandsEnabled ?? false
  useVoiceCommands({
    enabled: voiceModeOn && voiceCommandsOn && !!state && !state.isMatchOver,
    lang,
    onTeam1: () => config && recordPoint(matchId, 'team1', config),
    onTeam2: () => config && recordPoint(matchId, 'team2', config),
    onRepeat: repeatLastAnnouncement,
  })
  useVoiceAnnouncer({
    enabled: voiceModeOn,
    lang,
    rate: settings?.voiceRate ?? 1.5,
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

  // Doesn't depend on match/tournament/state/config — safe to define (and
  // call from useKeyCommands below) before the loading guard.
  const handleSave = async () => {
    setSaving(true)
    await saveMatch(matchId)
    onSaved()
  }

  useKeyCommands({
    enabled: !!state && !!config,
    bindings: settings?.keyBindings,
    actions: {
      team1: () => config && !state?.isMatchOver && recordPoint(matchId, 'team1', config),
      team2: () => config && !state?.isMatchOver && recordPoint(matchId, 'team2', config),
      repeat: repeatLastAnnouncement,
      undo: () => config && undoLastPoint(matchId, config),
      save: () => state?.isMatchOver && handleSave(),
    },
  })

  if (!match || !tournament || !state || !config) {
    return <div className="p-4 text-cream/70">{t('Carregando partida...')}</div>
  }

  const elapsedSeconds = match.startedAt ? Math.floor((now - match.startedAt) / 1000) : 0
  const courtSides = courtSidesForVoice ?? computeCourtSides(state, match.team1InitialSide ?? 'Esquerda')
  const layoutMode = settings?.layoutMode ?? 'auto'
  const isTablet = resolveEffectiveLayout(layoutMode, isWideViewport) === 'tablet'
  // Scales the tablet layout up further, but only when the viewport is
  // genuinely both wide AND tall — a forced Tablet mode on a small/short
  // phone keeps the compact sizes (already verified to fit there) instead
  // of scaling into a scroll.
  const isRoomyTablet = isTablet && isRoomyWidth && isTallViewport

  const handlePoint = (side: TeamSide) => {
    recordPoint(matchId, side, config)
  }

  const handleUndo = () => {
    undoLastPoint(matchId, config)
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
  // Bigger point-button variant for genuinely spacious tablets (see
  // isRoomyTablet) — built locally rather than varying bigButton/bigButtonAlt
  // themselves, since those stay the tuned-to-fit baseline for phones and
  // cramped/forced tablet sizes.
  const roomyButtonClass = (bg: 'bg-lime' | 'bg-cream') =>
    `flex-1 rounded-2xl ${bg} px-4 py-6 text-4xl font-bold text-navy disabled:opacity-30 disabled:cursor-not-allowed active:opacity-80`

  const team1Slot: TeamSlot = {
    key: 'team1',
    cardClass: 'border-lime bg-lime/10',
    labelClass: 'text-lime',
    label: 'Time 1',
    name: teamName(match.team1),
    history: courtSides.team1History,
    button: (
      <button
        key="team1"
        type="button"
        className={isRoomyTablet ? roomyButtonClass('bg-lime') : bigButton}
        onClick={() => handlePoint('team1')}
      >
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
        className={isRoomyTablet ? roomyButtonClass('bg-cream') : bigButtonAlt}
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

  const teamCard = (slot: TeamSlot) => (
    // Padding kept lower than the shared `card` constant's p-4 (built here
    // instead of layering a conflicting p-3 utility on top of it) — this
    // screen needs to fit without scrolling on small phones, unlike the
    // other screens `card` is used on. Scales up on a genuinely roomy
    // tablet (isRoomyTablet) — never on a phone or a cramped/forced tablet.
    // Prefixed key: in the tablet layout this card and its slot.button (key
    // "team1"/"team2") end up as siblings in the same column div — without
    // the prefix their keys would collide (React logs a duplicate-key
    // warning and may misidentify which node is which across updates).
    <div
      key={`card-${slot.key}`}
      className={`rounded-xl bg-navy-light border-2 ${slot.cardClass} ${isRoomyTablet ? 'p-6' : 'p-2'}`}
    >
      <div
        className={`font-black uppercase tracking-wide ${slot.labelClass} ${isRoomyTablet ? 'text-xl' : 'text-sm'}`}
      >
        {t(slot.label)}
      </div>
      {/* truncate (single line + ellipsis), not wrapping: this screen is
          tuned to never need scrolling on a small phone, and a wrapped
          2-line Duplas name ("A & B") would grow the row past that budget. */}
      <div className={`truncate font-bold text-cream ${isRoomyTablet ? 'text-4xl' : 'text-lg'}`}>
        {slot.name}
      </div>
      <SideHistory history={slot.history} />
    </div>
  )

  // Always rendered (even with 0 alerts) at a fixed min-height sized to the
  // tallest possible combination — a game/tiebreak/golden-point alert can
  // land on the same boundary point as change-ends, stacking two boxes at
  // once (measured: 88px compact / 160px roomy) — so whatever's below
  // (score, serve banner, point buttons) never shifts position when an
  // alert appears/disappears or a second one joins it mid-match.
  const alertsBlock = (
    <div
      className={`flex flex-col justify-center gap-1 ${isRoomyTablet ? 'min-h-[160px]' : 'min-h-[88px]'}`}
    >
      {alerts.map((alert) =>
        alert === 'change-ends' ? (
          <div
            key={alert}
            className={`rounded-lg border border-gold bg-gold/10 text-center font-bold text-gold ${
              isRoomyTablet ? 'py-4 text-2xl' : 'py-0.5 text-base'
            }`}
          >
            {t(ALERT_LABELS[alert])}
            <ChangeEndsCourt />
          </div>
        ) : (
          <div
            key={alert}
            className={`rounded-lg border border-gold bg-gold/10 text-center font-bold text-gold ${
              isRoomyTablet ? 'py-4 text-2xl' : 'py-0.5 text-base'
            }`}
          >
            {t(ALERT_LABELS[alert])}
          </div>
        ),
      )}
    </div>
  )

  const scoreBlock = (
    <div className={`rounded-2xl bg-navy-light text-center ${isRoomyTablet ? 'py-10' : 'py-3'}`}>
      {state.isTiebreak ? (
        <>
          <div
            className={`font-semibold uppercase tracking-wide text-lime ${isRoomyTablet ? 'text-lg' : 'text-sm'}`}
          >
            {t('Tiebreak')}
          </div>
          <div className={`font-black tabular-nums ${isRoomyTablet ? 'text-7xl' : 'text-6xl'}`}>
            {leftTiebreakPoints} – {rightTiebreakPoints}
          </div>
        </>
      ) : (
        <div className={`font-black tabular-nums ${isRoomyTablet ? 'text-7xl' : 'text-6xl'}`}>
          {pointLabel(leftGamePoints, rightGamePoints, config.deuceMode)}
          {' – '}
          {pointLabel(rightGamePoints, leftGamePoints, config.deuceMode)}
        </div>
      )}
      <div
        className={`font-semibold text-cream/80 tabular-nums ${isRoomyTablet ? 'mt-4 text-3xl' : 'mt-1 text-xl'}`}
      >
        {t('Games:')} {leftGames} – {rightGames}
      </div>
    </div>
  )

  const serveBanner = serveInfo && (
    <div
      data-testid="serve-banner"
      className={`rounded-xl border-l-4 border-lime bg-navy-light text-center font-bold text-cream ${
        isRoomyTablet ? 'px-6 py-6 text-3xl' : 'px-4 py-1.5 text-lg'
      } ${serverPulse ? 'animate-serve-pulse' : ''}`}
    >
      <span aria-hidden="true">🎾</span> {t('Saca agora:')} {name(serveInfo.serverId)} —{' '}
      <span className={serveInfo.side === 'Direita' ? 'text-lime' : 'text-gold'}>
        {t(serveInfo.side)}
      </span>
    </div>
  )

  const matchOverCard = (
    <div className={`rounded-xl bg-navy-light ${isRoomyTablet ? 'p-8' : 'p-2'}`}>
      <h2 className={`font-bold ${isRoomyTablet ? 'mb-4 text-3xl' : 'mb-1 text-lg'}`}>
        {t('Resultado final')}
      </h2>
      <p className={`font-semibold ${isRoomyTablet ? 'text-2xl' : 'text-base'}`}>
        {teamName(match.team1)} {state.finalGames1} × {state.finalGames2} {teamName(match.team2)}
      </p>
      <p className={`text-cream/70 ${isRoomyTablet ? 'mt-2 text-lg' : 'text-sm'}`}>
        {t('Pontos:')} {match.points1} – {match.points2} · {t('Duração:')}{' '}
        {formatDuration(elapsedSeconds)}
      </p>
      <button
        type="button"
        className={`${isRoomyTablet ? roomyButtonClass('bg-lime') : bigButton} ${
          isRoomyTablet ? 'mt-6' : 'mt-1'
        } w-full`}
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? t('Salvando...') : t('Salvar partida')}
      </button>
    </div>
  )

  // Each team can win at most gamesToWinSet+1 games (the "+1" only happens
  // when the winner takes it via a tiebreak from a gamesToWinSet-gamesToWinSet
  // tie) — so a fixed row of that many boxes per team always has enough room,
  // never needs to grow mid-match, and directly shows what was configured.
  const gamesTarget = config.gamesToWinSet
  const boxCount = gamesTarget + 1
  const games1Filled = state.isMatchOver ? (state.finalGames1 ?? state.games1) : state.games1
  const games2Filled = state.isMatchOver ? (state.finalGames2 ?? state.games2) : state.games2
  const gamesLeadCount = Math.max(games1Filled, games2Filled)

  const gamesRow = (testId: string, filled: number, filledClass: string, emptyClass: string) => (
    <div data-testid={testId} className="flex flex-1 gap-1">
      {Array.from({ length: boxCount }, (_, i) => (
        <div
          key={i}
          className={`h-2.5 flex-1 rounded-sm border ${i < filled ? filledClass : emptyClass}`}
        />
      ))}
    </div>
  )

  // Team 1 = lime, Team 2 = cream — same convention as team1Slot/team2Slot's
  // card colors below, so the row above lines up with the card it belongs to
  // without needing a "T1"/"T2" label in each box.
  const gamesProgressBlock = (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-1">
      {gamesRow('games-progress-team1', games1Filled, 'border-lime bg-lime', 'border-lime/25')}
      {gamesRow('games-progress-team2', games2Filled, 'border-cream bg-cream', 'border-cream/25')}
    </div>
  )

  const layoutToggle = (
    <button
      type="button"
      aria-label={t('Modo de layout')}
      onClick={() => updateSettings({ layoutMode: nextLayoutMode(layoutMode) })}
      className="ml-auto flex min-h-7 items-center gap-1 rounded-md border border-cream/20 px-2 text-xs font-bold text-cream/50"
    >
      <span aria-hidden="true">📐</span> {t(LAYOUT_MODE_LABELS[layoutMode])}
    </button>
  )

  return (
    <div className="flex flex-col gap-1 p-3">
      {/* Grid (not a plain flex row with an absolutely-centered label) so the
          "Games: X de Y" label gets its own middle column that can never
          overlap the timer/rodada text or the layout toggle, however long
          each side's content gets on a narrow phone. */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm text-cream/60">
        <div className="flex items-center gap-2">
          <span className="tabular-nums">{formatDuration(elapsedSeconds)}</span>
          <span>
            {t('Rodada')} {match.roundIndex + 1}
          </span>
        </div>
        <div className="truncate text-center font-semibold text-cream/80">
          {t('Games: {x} de {y}', { x: gamesLeadCount, y: gamesTarget })}
        </div>
        {layoutToggle}
      </div>
      {gamesProgressBlock}

      {isTablet ? (
        <div className="grid grid-cols-[1fr_1.4fr_1fr] items-stretch gap-3">
          <div className="flex flex-col gap-2">
            {teamCard(orderedSlots[0])}
            {!state.isMatchOver && orderedSlots[0].button}
          </div>
          <div className="flex flex-col gap-2 text-center">
            {alertsBlock}
            {!state.isMatchOver ? (
              <>
                {scoreBlock}
                {serveBanner}
              </>
            ) : (
              matchOverCard
            )}
          </div>
          <div className="flex flex-col gap-2">
            {teamCard(orderedSlots[1])}
            {!state.isMatchOver && orderedSlots[1].button}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">{orderedSlots.map(teamCard)}</div>
          {alertsBlock}
          {scoreBlock}
          {serveBanner}
          {!state.isMatchOver ? (
            <div className="flex gap-3">{orderedSlots.map((slot) => slot.button)}</div>
          ) : (
            matchOverCard
          )}
        </>
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
