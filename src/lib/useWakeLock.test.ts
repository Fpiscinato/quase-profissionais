// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWakeLock, wakeLockSupported } from './useWakeLock'

describe('useWakeLock', () => {
  it('is a no-op (does not throw) where the Wake Lock API is unavailable, e.g. jsdom', () => {
    expect(wakeLockSupported()).toBe(false)
    const { unmount } = renderHook(() => useWakeLock(true))
    expect(() => unmount()).not.toThrow()
  })

  it('is also a no-op when disabled', () => {
    const { unmount } = renderHook(() => useWakeLock(false))
    expect(() => unmount()).not.toThrow()
  })
})
