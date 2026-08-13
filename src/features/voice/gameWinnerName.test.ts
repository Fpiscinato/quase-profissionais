import { describe, expect, it } from 'vitest'
import { gameWinnerName } from './useVoiceAnnouncer'

describe('gameWinnerName', () => {
  it('returns null when there is no previous games tally to compare against', () => {
    expect(gameWinnerName(undefined, undefined, 1, 0, 'Time 1', 'Time 2')).toBeNull()
  })

  it("names team 1 when team 1's games tally went up", () => {
    expect(gameWinnerName(1, 2, 2, 2, 'Time 1', 'Time 2')).toBe('Time 1')
  })

  it("names team 2 when team 2's games tally went up", () => {
    expect(gameWinnerName(3, 3, 3, 4, 'Time 1', 'Time 2')).toBe('Time 2')
  })

  it('returns null when neither tally changed', () => {
    expect(gameWinnerName(2, 2, 2, 2, 'Time 1', 'Time 2')).toBeNull()
  })
})
