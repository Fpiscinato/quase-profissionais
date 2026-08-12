import { useEffect, useRef } from 'react'

interface UseKeyCommandsOptions {
  enabled: boolean
  /** action id -> KeyboardEvent.code */
  bindings: Record<string, string> | undefined
  actions: Partial<Record<string, () => void>>
}

/**
 * Hands-free scoring/control from a physical remote (a presenter "clicker"
 * or any device that emulates a keyboard): while enabled, listens for
 * keydown at the window level (the remote is an HID device, it fires
 * regardless of what's focused — the live screen has no text inputs
 * competing for focus anyway) and dispatches whichever action's bound key
 * was pressed. Mirrors useVoiceCommands's shape/lifecycle.
 */
export function useKeyCommands({ enabled, bindings, actions }: UseKeyCommandsOptions): void {
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  useEffect(() => {
    if (!enabled || !bindings) return
    const entries = Object.entries(bindings)
    if (entries.length === 0) return

    const handler = (event: KeyboardEvent) => {
      const match = entries.find(([, code]) => code === event.code)
      if (!match) return
      event.preventDefault()
      actionsRef.current[match[0]]?.()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, bindings])
}
