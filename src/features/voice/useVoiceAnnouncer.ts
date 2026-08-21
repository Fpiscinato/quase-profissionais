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
  /** SpeechSynthesis playback rate (1 = normal). */
  rate: number
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
 * Name of whichever team's games tally just went up (i.e. who won the game
 * that just ended), by comparing against the games score before this
 * transition. Returns null when there's no reliable "before" to compare
 * against (e.g. the announcer just (re)mounted mid-match) — callers omit the
 * winner sentence in that case rather than guess.
 */
export function gameWinnerName(
  prevGames1: number | undefined,
  prevGames2: number | undefined,
  games1: number,
  games2: number,
  team1Name: string,
  team2Name: string,
): string | null {
  if (prevGames1 === undefined || prevGames2 === undefined) return null
  if (games1 > prevGames1) return team1Name
  if (games2 > prevGames2) return team2Name
  return null
}

/**
 * Speaks score/serve/side updates out loud as they happen, so a player
 * without anyone free to hold the phone can keep track by ear (paired to a
 * Bluetooth speaker, this just uses the device's normal audio output). Only
 * speaks on an actual state transition — never replays history — and resets
 * its "what did we already say" tracking whenever matchId changes.
 */
export function useVoiceAnnouncer(opts: UseVoiceAnnouncerOptions): void {
  const prevRef = useRef<{
    matchId: string
    totalPointsPlayed: number
    games1: number
    games2: number
  } | null>(null)

  // No dependency array on purpose: this needs the *latest* derived values
  // (serveInfo, courtSides, alerts, ...) every time, and speak() itself is
  // guarded below so it only ever fires on a real transition — running the
  // comparison after every render is cheap and avoids a huge/fragile deps list.
  useEffect(() => {
    if (!opts.enabled || !opts.state) {
      prevRef.current = null
      return
    }

    const { matchId, state, lang, rate } = opts
    const prev = prevRef.current
    const isFirstForThisMatch = !prev || prev.matchId !== matchId
    if (!isFirstForThisMatch && prev.totalPointsPlayed === state.totalPointsPlayed) {
      return
    }
    const prevGames1 = prev && prev.matchId === matchId ? prev.games1 : undefined
    const prevGames2 = prev && prev.matchId === matchId ? prev.games2 : undefined
    prevRef.current = {
      matchId,
      totalPointsPlayed: state.totalPointsPlayed,
      games1: state.games1,
      games2: state.games2,
    }

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
          rate,
        )
      }
      return
    }

    if (state.isMatchOver) {
      const winnerName: string =
        state.winner === ('team1' satisfies TeamSide) ? opts.team1Name : opts.team2Name
      // "Sets: X a Y" only when the match actually went beyond a single set —
      // saying "Sets: 1 a 0" after every ordinary single-set match would be
      // pure noise for the common case.
      const text =
        state.completedSets.length > 1
          ? t('Fim de partida! {winner} venceu. Sets: {s1} a {s2}.', {
              winner: winnerName,
              s1: state.sets1,
              s2: state.sets2,
            })
          : t('Fim de partida! {winner} venceu, {g1} a {g2}.', {
              winner: winnerName,
              g1: state.finalGames1 ?? state.games1,
              g2: state.finalGames2 ?? state.games2,
            })
      speak(lang, text, rate)
      return
    }

    // A set just ended but the match continues (best-of-3/5) — announce the
    // set result and sets tally, distinct from the 'game'/'tiebreak' reading
    // below, then keep going (may also be entering the deciding super-tiebreak).
    if (opts.alerts.includes('set-over')) {
      const justFinishedSet = state.completedSets[state.completedSets.length - 1]
      const setOverParts: string[] = []
      if (justFinishedSet) {
        const setWinnerName = justFinishedSet.winner === 'team1' ? opts.team1Name : opts.team2Name
        setOverParts.push(
          t('Fim do set! {winner} venceu, {g1} a {g2}. Sets: {s1} a {s2}.', {
            winner: setWinnerName,
            g1: justFinishedSet.games1,
            g2: justFinishedSet.games2,
            s1: state.sets1,
            s2: state.sets2,
          }),
        )
      }
      if (opts.alerts.includes('tiebreak')) {
        setOverParts.push(t('Super tiebreak decisivo!'))
      }
      if (opts.serveInfo) {
        setOverParts.push(
          t('{server} saca da {side}.', {
            server: opts.serverName,
            side: sideWord(opts.serveInfo.side),
          }),
        )
      }
      speak(lang, setOverParts.join(' '), rate)
      return
    }

    const parts: string[] = []

    // Whenever a normal game just ended (either the 'game' alert, or the
    // 'tiebreak' alert — set just tied, which is also the end of a game),
    // lead with who won it and the resulting games tally, before anything
    // else — reading two bare numbers with no "who won" first is what made
    // this confusing to follow live.
    if (opts.alerts.includes('game') || opts.alerts.includes('tiebreak')) {
      const winnerName = gameWinnerName(
        prevGames1,
        prevGames2,
        state.games1,
        state.games2,
        opts.team1Name,
        opts.team2Name,
      )
      if (winnerName) {
        parts.push(t('{winner} venceu o game!', { winner: winnerName }))
      }
      parts.push(t('Games: Time 1, {g1}. Time 2, {g2}.', { g1: state.games1, g2: state.games2 }))
    }

    if (opts.alerts.includes('tiebreak')) {
      parts.push(t('Tiebreak!'))
    } else if (opts.alerts.includes('golden-point')) {
      parts.push(t('Ponto de ouro!'))
    } else if (!opts.alerts.includes('game')) {
      if (state.isTiebreak) {
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
    }

    if (opts.alerts.includes('change-ends') && opts.courtSides) {
      parts.push(
        t('Troquem de lado — Time 1 na {side1}, Time 2 na {side2}.', {
          side1: sideWord(opts.courtSides.team1),
          side2: sideWord(opts.courtSides.team2),
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

    speak(lang, parts.join(' '), rate)
  })
}
