import type { Lang } from '../../i18n/i18n'

function voiceLangTag(lang: Lang): string {
  return lang === 'en' ? 'en-US' : 'pt-BR'
}

// Some pt-BR TTS voices read "Time" (equipe) with the English pronunciation
// of the identically-spelled word "time" (heteronym clash), even with
// utterance.lang set to pt-BR. Respelling for the audio only — never for
// what's shown on screen — works around it. Not verified on a real device
// yet; if it still sounds wrong, this is the constant to tweak.
const PT_SPEECH_RESPELLINGS: [RegExp, string][] = [[/\bTime\b/g, 'Timi']]

function toSpeechText(lang: Lang, text: string): string {
  if (lang !== 'pt') return text
  return PT_SPEECH_RESPELLINGS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text)
}

export function speechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// Remembers the last thing spoken (and at what rate) so the "Repita" /
// "Repeat" voice command (see useVoiceCommands) can say it again without the
// caller needing to track its own history.
let lastSpoken: { lang: Lang; text: string; rate: number } | null = null

// iOS Safari only allows a speak() call to produce sound if it (or an
// earlier speak() this same page load) ran synchronously inside a real user
// gesture handler — a call from a later effect/timer/async callback is
// silently dropped until that's happened once. Once primed, later async
// speak() calls keep working for the rest of this page load (this is the
// standard cross-browser TTS library workaround, not a guess). `voiceMode`
// is a persisted setting though, so on a fresh page load where it's already
// ON (the common case for a PWA that gets fully reloaded each time it's
// opened) nobody necessarily taps the "Voz" button this session — see
// App.tsx's document-wide first-tap listener, which calls primeSpeechEngine
// to cover that case silently, without waiting for that specific button.
let primed = false

export function primeSpeechEngine(lang: Lang): void {
  if (primed || !speechSynthesisSupported()) return
  primed = true
  const utterance = new SpeechSynthesisUtterance(' ')
  utterance.lang = voiceLangTag(lang)
  utterance.volume = 0
  utterance.rate = 10
  window.speechSynthesis.speak(utterance)
}

/**
 * Speaks text aloud through whatever audio output is active (a paired
 * Bluetooth speaker included — this is just the device's normal audio
 * output). Cancels anything still queued/speaking first, so a fast run of
 * points never leaves announcements piling up behind live play. No-ops
 * silently where SpeechSynthesis isn't available.
 *
 * @param rate SpeechSynthesisUtterance playback rate (1 = normal). Defaults to 1.
 */
export function speak(lang: Lang, text: string, rate = 1): void {
  if (!text) return
  lastSpoken = { lang, text, rate }
  primed = true
  if (!speechSynthesisSupported()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(toSpeechText(lang, text))
  utterance.lang = voiceLangTag(lang)
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)
}

/** Re-speaks whatever was last announced, at the same rate — the "Repita"/"Repeat" voice command. */
export function repeatLastAnnouncement(): void {
  if (!lastSpoken || !speechSynthesisSupported()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(toSpeechText(lastSpoken.lang, lastSpoken.text))
  utterance.lang = voiceLangTag(lastSpoken.lang)
  utterance.rate = lastSpoken.rate
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (!speechSynthesisSupported()) return
  window.speechSynthesis.cancel()
}
