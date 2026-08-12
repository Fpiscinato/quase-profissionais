import { useEffect, useRef } from 'react'

export function wakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

/**
 * Keeps the screen from turning off while `enabled` — used on the live match
 * screen so it stays on for the whole match (not just when voice mode is on).
 * The screen turning off is the likely real cause of the voice-command
 * session cancelling mid-match, and it's useful regardless of voice.
 * No-ops silently where the Screen Wake Lock API isn't available.
 */
export function useWakeLock(enabled: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!enabled || !wakeLockSupported()) return

    let cancelled = false

    async function acquire() {
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          sentinel.release()
          return
        }
        sentinelRef.current = sentinel
        sentinel.onrelease = () => {
          sentinelRef.current = null
        }
      } catch {
        // Denied or transient failure — nothing actionable, just leave the
        // screen to its normal behavior.
      }
    }

    acquire()

    // The browser releases the lock automatically when the tab/app goes to
    // the background and does NOT reacquire it on its own when it comes back
    // — without this, the lock would silently stop working after the very
    // first time the screen is switched away from during a match.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current && !cancelled) {
        acquire()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      sentinelRef.current?.release()
      sentinelRef.current = null
    }
  }, [enabled])
}
