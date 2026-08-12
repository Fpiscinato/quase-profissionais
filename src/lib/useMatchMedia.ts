import { useEffect, useState } from 'react'

function matchMediaSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

/**
 * Reactive `window.matchMedia(query).matches`. Returns false where
 * matchMedia isn't available (e.g. jsdom in tests) instead of throwing —
 * that degrades to today's single (smartphone) layout, so existing tests
 * keep passing unmodified.
 */
export function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    matchMediaSupported() ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    if (!matchMediaSupported()) return
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}
