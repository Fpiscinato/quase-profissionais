import { useEffect, useRef } from 'react'
import { translate, type Lang } from '../../i18n/i18n'
import type { DeuceMode, MatchState, TeamSide } from '../../engine/types'
import type { CourtSides } from '../match/courtSide'
import type { ServeInfo } from '../match/serveInfo'
import type { LiveAlert } from '../match/alerts'
import { pointLabel } from '../match/display'
import { speak } from './speech'

interface UseVoiceAnnouncerOptions {
  enabled: boolean
  lang: Lang
  matchId: string
  /** Undefined while the match/tournament data is still loading — hook no-ops until it's ready. */
  state: MatchState | undefined
  deuceMode: DeuceMode | undefined
  alerts: LiveAlert[]
  serveInfo: ServeInfo | null
  serverName: string
  courtSides: CourtSides | undefined
  team1Name: string
  team2Name: string
}

/**
 * Speaks score/serve/side updates out loud as they happen, so a player
 * without anyone free to hold the phone can keep track by ear (paired to a
 * Bluetooth speaker, this just uses the device's normal audio output). Only
 * speaks on an actual state transition — never replays history — and resets
 * its "what did we already say" tracking whenever matchId changes.
 */
export function useVoiceAnnouncer(opts: UseVoiceAnnouncerOptions): void {
  const prevRef = useRef<{ matchId: string; totalPointsPlayed: number } | null>(null)

  // No dependency array on purpose: this needs the *latest* derived values
  // (serveInfo, courtSides, alerts, ...) every time, and speak() itself is
  // guarded below so it only ever fires on a real transition — running the
  // comparison after every render is cheap and avoids a huge/fragile deps list.
  useEffect(() => {
    if (!opts.enabled || !opts.state) {
      prevRef.current = null
      return
    }

    const { matchId, state, lang } = opts
    const prev = prevRef.current
    const isFirstForThisMatch = !prev || prev.matchId !== matchId
    if (!isFirstForThisMatch && prev.totalPointsPlayed === state.totalPointsPlayed) {
      return
    }
    prevRef.current = { matchId, totalPointsPlayed: state.totalPointsPlayed }

    const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars)
    const sideWord = (side: 'Direita' | 'Esquerda') => t(side)

    if (isFirstForThisMatch) {
      if (opts.serveInfo) {
        speak(
          lang,
          t('{server} saca da {side}.', {
            server: opts.serverName,
            side: sideWord(opts.serveInfo.side),
          }),
        )
      }
      return
    }

    if (state.isMatchOver) {
      const winnerName: string =
        state.winner === ('team1' satisfies TeamSide) ? opts.team1Name : opts.team2Name
      speak(
        lang,
        t('Fim de partida! {winner} venceu, {g1} a {g2}.', {
          winner: winnerName,
          g1: state.finalGames1 ?? state.games1,
          g2: state.finalGames2 ?? state.games2,
        }),
      )
      return
    }

    const parts: string[] = []

    if (opts.alerts.includes('change-ends') && opts.courtSides) {
      parts.push(
        t('Troca de lado! Time 1 na {side1}, Time 2 na {side2}.', {
          side1: sideWord(opts.courtSides.team1),
          side2: sideWord(opts.courtSides.team2),
        }),
      )
    }

    if (opts.alerts.includes('tiebreak')) {
      parts.push(t('Tiebreak!'))
    } else if (opts.alerts.includes('golden-point')) {
      parts.push(t('Ponto de ouro!'))
    } else if (opts.alerts.includes('game')) {
      parts.push(
        t('Game! Games: Time 1, {g1}. Time 2, {g2}.', { g1: state.games1, g2: state.games2 }),
      )
    } else if (state.isTiebreak) {
      parts.push(
        t('Tiebreak. Time 1, {p1}. Time 2, {p2}.', {
          p1: state.tiebreak.points1,
          p2: state.tiebreak.points2,
        }),
      )
    } else {
      const deuceMode = opts.deuceMode ?? 'advantage'
      parts.push(
        t('Time 1, {p1}. Time 2, {p2}.', {
          p1: pointLabel(state.currentGame.points1, state.currentGame.points2, deuceMode),
          p2: pointLabel(state.currentGame.points2, state.currentGame.points1, deuceMode),
        }),
      )
    }

    if (opts.serveInfo) {
      parts.push(
        t('{server} saca da {side}.', {
          server: opts.serverName,
          side: sideWord(opts.serveInfo.side),
        }),
      )
    }

    speak(lang, parts.join(' '))
  })
}
