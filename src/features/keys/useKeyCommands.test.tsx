// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { useKeyCommands } from './useKeyCommands'

afterEach(cleanup)

function pressKey(code: string) {
  return window.dispatchEvent(new KeyboardEvent('keydown', { code, cancelable: true }))
}

describe('useKeyCommands', () => {
  it('dispatches the bound action and prevents default when a mapped key is pressed', () => {
    const onTeam1 = vi.fn()
    renderHook(() =>
      useKeyCommands({
        enabled: true,
        bindings: { team1: 'PageDown' },
        actions: { team1: onTeam1 },
      }),
    )

    const notPrevented = pressKey('PageDown')
    expect(onTeam1).toHaveBeenCalledTimes(1)
    expect(notPrevented).toBe(false) // dispatchEvent returns false when preventDefault was called
  })

  it('ignores an unmapped key and does not prevent its default', () => {
    const onTeam1 = vi.fn()
    renderHook(() =>
      useKeyCommands({
        enabled: true,
        bindings: { team1: 'PageDown' },
        actions: { team1: onTeam1 },
      }),
    )

    const notPrevented = pressKey('KeyA')
    expect(onTeam1).not.toHaveBeenCalled()
    expect(notPrevented).toBe(true)
  })

  it('does nothing while disabled', () => {
    const onTeam1 = vi.fn()
    renderHook(() =>
      useKeyCommands({
        enabled: false,
        bindings: { team1: 'PageDown' },
        actions: { team1: onTeam1 },
      }),
    )

    pressKey('PageDown')
    expect(onTeam1).not.toHaveBeenCalled()
  })

  it('does nothing without bindings', () => {
    const onTeam1 = vi.fn()
    renderHook(() =>
      useKeyCommands({ enabled: true, bindings: undefined, actions: { team1: onTeam1 } }),
    )

    pressKey('PageDown')
    expect(onTeam1).not.toHaveBeenCalled()
  })

  it('always dispatches the latest action even without re-registering the listener', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(
      ({ action }: { action: () => void }) =>
        useKeyCommands({
          enabled: true,
          bindings: { team1: 'PageDown' },
          actions: { team1: action },
        }),
      { initialProps: { action: first } },
    )

    rerender({ action: second })
    pressKey('PageDown')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
