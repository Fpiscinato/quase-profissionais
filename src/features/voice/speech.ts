import type { Lang } from '../../i18n/i18n'

function voiceLangTag(lang: Lang): string {
  return lang === 'en' ? 'en-US' : 'pt-BR'
}

export function speechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// Remembers the last thing spoken (and at what rate) so the "Repita" /
// "Repeat" voice command (see useVoiceCommands) can say it again without the
// caller needing to track its own history.
let lastSpoken: { lang: Lang; text: string; rate: number } | null = null

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
  if (!speechSynthesisSupported()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = voiceLangTag(lang)
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)
}

/** Re-speaks whatever was last announced, at the same rate — the "Repita"/"Repeat" voice command. */
export function repeatLastAnnouncement(): void {
  if (!lastSpoken || !speechSynthesisSupported()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(lastSpoken.text)
  utterance.lang = voiceLangTag(lastSpoken.lang)
  utterance.rate = lastSpoken.rate
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (!speechSynthesisSupported()) return
  window.speechSynthesis.cancel()
}
