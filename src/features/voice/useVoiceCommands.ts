import { useEffect, useRef } from 'react'
import type { Lang } from '../../i18n/i18n'

// The Web Speech recognition API is still non-standard: Chrome exposes it as
// `webkitSpeechRecognition` (and, on newer versions, also as
// `SpeechRecognition`), while TS's DOM lib doesn't ship types for it. Kept
// minimal — only what this hook actually uses.
interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionErrorEventLike {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function voiceCommandsSupported(): boolean {
  return getSpeechRecognitionCtor() !== null
}

// Matched regardless of the active UI language — a household or group that
// mixes PT/EN shouldn't have commands silently fail just because someone
// said the "other" one.
const TEAM1_PHRASES = ['ponto time 1', 'ponto time um', 'point team 1', 'point team one']
const TEAM2_PHRASES = ['ponto time 2', 'ponto time dois', 'point team 2', 'point team two']
// Repeats the last thing spoken — same word in both languages, so it works
// no matter which language the app/recognizer is currently set to.
const REPEAT_PHRASES = ['repita', 'repete', 'repeat']

function matchesAny(transcript: string, phrases: string[]): boolean {
  const normalized = transcript.toLowerCase().trim()
  return phrases.some((phrase) => normalized.includes(phrase))
}

interface UseVoiceCommandsOptions {
  enabled: boolean
  lang: Lang
  onTeam1: () => void
  onTeam2: () => void
  onRepeat: () => void
}

/**
 * Hands-free scoring: while enabled, continuously listens for "Ponto Time 1"
 * / "Ponto Time 2" (or the English equivalents) so a player wearing a
 * headset mic can call points without touching the phone. Browser support
 * is inconsistent — solid on Chrome/Android, absent on iOS Safari — so this
 * no-ops wherever the API isn't available instead of throwing.
 */
export function useVoiceCommands({
  enabled,
  lang,
  onTeam1,
  onTeam2,
  onRepeat,
}: UseVoiceCommandsOptions): void {
  const onTeam1Ref = useRef(onTeam1)
  const onTeam2Ref = useRef(onTeam2)
  const onRepeatRef = useRef(onRepeat)
  onTeam1Ref.current = onTeam1
  onTeam2Ref.current = onTeam2
  onRepeatRef.current = onRepeat

  useEffect(() => {
    if (!enabled) return
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return

    let stopped = false
    const recognition = new Ctor()
    recognition.lang = lang === 'en' ? 'en-US' : 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result.isFinal) continue
        const transcript = result[0]?.transcript ?? ''
        if (matchesAny(transcript, TEAM1_PHRASES)) onTeam1Ref.current()
        else if (matchesAny(transcript, TEAM2_PHRASES)) onTeam2Ref.current()
        else if (matchesAny(transcript, REPEAT_PHRASES)) onRepeatRef.current()
      }
    }

    recognition.onerror = (event) => {
      // Permission denied (or blocked by browser policy) won't fix itself by
      // retrying — stop restarting so we don't spam failed attempts.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopped = true
      }
    }

    // A recognition session ends on its own (silence, browser time limits) —
    // restart it automatically while this hook is still enabled, so "escuta
    // contínua" actually stays continuous rather than a one-shot listen.
    recognition.onend = () => {
      if (!stopped) {
        try {
          recognition.start()
        } catch {
          // already starting/started — ignore
        }
      }
    }

    try {
      recognition.start()
    } catch {
      // start() throws if called while already running — ignore
    }

    return () => {
      stopped = true
      recognition.onend = null
      recognition.stop()
    }
  }, [enabled, lang])
}
