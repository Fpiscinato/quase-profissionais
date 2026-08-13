import { describe, expect, it } from 'vitest'
import { modeMatchesPlayed } from './rankingFilter'

describe('modeMatchesPlayed', () => {
  it('returns null for an empty list', () => {
    expect(modeMatchesPlayed([])).toBeNull()
  })

  it('picks the value that appears most often', () => {
    expect(modeMatchesPlayed([5, 5, 5, 4, 4])).toBe(5)
  })

  it('breaks a frequency tie toward the higher count', () => {
    expect(modeMatchesPlayed([4, 4, 5, 5])).toBe(5)
  })

  it('returns the only value when everyone matches', () => {
    expect(modeMatchesPlayed([3, 3, 3])).toBe(3)
  })
})
