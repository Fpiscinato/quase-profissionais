import { describe, expect, it } from 'vitest'
import { nextLayoutMode, resolveEffectiveLayout } from './layoutMode'

describe('resolveEffectiveLayout', () => {
  it('auto picks tablet on a wide viewport', () => {
    expect(resolveEffectiveLayout('auto', true)).toBe('tablet')
  })
  it('auto picks smartphone on a narrow viewport', () => {
    expect(resolveEffectiveLayout('auto', false)).toBe('smartphone')
  })
  it('an explicit tablet mode wins regardless of viewport width', () => {
    expect(resolveEffectiveLayout('tablet', false)).toBe('tablet')
  })
  it('an explicit smartphone mode wins regardless of viewport width', () => {
    expect(resolveEffectiveLayout('smartphone', true)).toBe('smartphone')
  })
})

describe('nextLayoutMode', () => {
  it('cycles auto -> tablet -> smartphone -> auto', () => {
    expect(nextLayoutMode('auto')).toBe('tablet')
    expect(nextLayoutMode('tablet')).toBe('smartphone')
    expect(nextLayoutMode('smartphone')).toBe('auto')
  })
})
