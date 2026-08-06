import { describe, expect, it } from 'vitest'
import {
  buildServeOrder,
  changeEndsCount,
  courtSideHistory,
  currentCourtSide,
  nextServer,
  serveSide,
  shouldChangeEnds,
  tiebreakServer,
  tiebreakServerRotationOffset,
} from './serve'

describe('buildServeOrder', () => {
  it('interleaves doubles teams so consecutive servers are on opposite teams', () => {
    const order = buildServeOrder(['A', 'C'], ['B', 'D'])
    expect(order).toEqual(['A', 'B', 'C', 'D'])
  })

  it('handles singles (team size 1)', () => {
    const order = buildServeOrder(['A'], ['B'])
    expect(order).toEqual(['A', 'B'])
  })
})

describe('nextServer', () => {
  it('rotates by game: game 1 -> S1, game 2 -> S2, ...', () => {
    const order = ['A', 'B', 'C', 'D']
    expect(nextServer(order, 0)).toBe('A')
    expect(nextServer(order, 1)).toBe('B')
    expect(nextServer(order, 2)).toBe('C')
    expect(nextServer(order, 3)).toBe('D')
  })

  it('wraps around after the full order is exhausted', () => {
    const order = ['A', 'B', 'C', 'D']
    expect(nextServer(order, 4)).toBe('A')
    expect(nextServer(order, 5)).toBe('B')
  })

  it('works with a singles order of length 2, alternating by game', () => {
    const order = ['A', 'B']
    expect(nextServer(order, 0)).toBe('A')
    expect(nextServer(order, 1)).toBe('B')
    expect(nextServer(order, 2)).toBe('A')
    expect(nextServer(order, 3)).toBe('B')
  })
})

describe('serveSide', () => {
  it('point 1 (0 completed) is always Direita', () => {
    expect(serveSide(0)).toBe('Direita')
  })

  it('alternates every point thereafter', () => {
    expect(serveSide(1)).toBe('Esquerda')
    expect(serveSide(2)).toBe('Direita')
    expect(serveSide(3)).toBe('Esquerda')
    expect(serveSide(4)).toBe('Direita')
  })
})

describe('shouldChangeEnds', () => {
  it('changes ends after odd totals of completed games (1, 3, 5, ...)', () => {
    expect(shouldChangeEnds({ isTiebreak: false, totalGamesCompleted: 1, tiebreakPointsCompleted: 0 })).toBe(true)
    expect(shouldChangeEnds({ isTiebreak: false, totalGamesCompleted: 2, tiebreakPointsCompleted: 0 })).toBe(false)
    expect(shouldChangeEnds({ isTiebreak: false, totalGamesCompleted: 3, tiebreakPointsCompleted: 0 })).toBe(true)
    expect(shouldChangeEnds({ isTiebreak: false, totalGamesCompleted: 7, tiebreakPointsCompleted: 0 })).toBe(true)
  })

  it('does not change ends after even totals of completed games', () => {
    expect(shouldChangeEnds({ isTiebreak: false, totalGamesCompleted: 4, tiebreakPointsCompleted: 0 })).toBe(false)
  })

  it('in a tiebreak, changes ends every 6 points', () => {
    expect(shouldChangeEnds({ isTiebreak: true, totalGamesCompleted: 8, tiebreakPointsCompleted: 6 })).toBe(true)
    expect(shouldChangeEnds({ isTiebreak: true, totalGamesCompleted: 8, tiebreakPointsCompleted: 12 })).toBe(true)
    expect(shouldChangeEnds({ isTiebreak: true, totalGamesCompleted: 8, tiebreakPointsCompleted: 5 })).toBe(false)
    expect(shouldChangeEnds({ isTiebreak: true, totalGamesCompleted: 8, tiebreakPointsCompleted: 0 })).toBe(false)
  })
})

describe('changeEndsCount', () => {
  it('counts one swap after each odd total of completed games', () => {
    expect(changeEndsCount({ isTiebreak: false, totalGamesCompleted: 0, tiebreakPointsCompleted: 0 })).toBe(0)
    expect(changeEndsCount({ isTiebreak: false, totalGamesCompleted: 1, tiebreakPointsCompleted: 0 })).toBe(1)
    expect(changeEndsCount({ isTiebreak: false, totalGamesCompleted: 2, tiebreakPointsCompleted: 0 })).toBe(1)
    expect(changeEndsCount({ isTiebreak: false, totalGamesCompleted: 3, tiebreakPointsCompleted: 0 })).toBe(2)
    expect(changeEndsCount({ isTiebreak: false, totalGamesCompleted: 4, tiebreakPointsCompleted: 0 })).toBe(2)
    expect(changeEndsCount({ isTiebreak: false, totalGamesCompleted: 7, tiebreakPointsCompleted: 0 })).toBe(4)
  })

  it('adds a swap every 6 points once a tiebreak starts, on top of the games-completed swaps', () => {
    // Tiebreak starts at 4-4 (8 games completed) -> 4 swaps already banked from the set.
    expect(changeEndsCount({ isTiebreak: true, totalGamesCompleted: 8, tiebreakPointsCompleted: 0 })).toBe(4)
    expect(changeEndsCount({ isTiebreak: true, totalGamesCompleted: 8, tiebreakPointsCompleted: 5 })).toBe(4)
    expect(changeEndsCount({ isTiebreak: true, totalGamesCompleted: 8, tiebreakPointsCompleted: 6 })).toBe(5)
    expect(changeEndsCount({ isTiebreak: true, totalGamesCompleted: 8, tiebreakPointsCompleted: 12 })).toBe(6)
  })
})

describe('currentCourtSide / courtSideHistory', () => {
  it('team 1 stays on its initial side with 0 swaps, flips with an odd swap count', () => {
    expect(currentCourtSide('Direita', 0)).toBe('Direita')
    expect(currentCourtSide('Direita', 1)).toBe('Esquerda')
    expect(currentCourtSide('Direita', 2)).toBe('Direita')
    expect(currentCourtSide('Esquerda', 1)).toBe('Direita')
  })

  it('history has one entry per segment played, alternating from the initial side', () => {
    expect(courtSideHistory('Direita', 0)).toEqual(['Direita'])
    expect(courtSideHistory('Direita', 1)).toEqual(['Direita', 'Esquerda'])
    expect(courtSideHistory('Direita', 2)).toEqual(['Direita', 'Esquerda', 'Direita'])
    expect(courtSideHistory('Esquerda', 3)).toEqual(['Esquerda', 'Direita', 'Esquerda', 'Direita'])
  })
})

describe('tiebreak serving rotation', () => {
  it('rotation offset: first server serves 1 point, then each next server serves 2', () => {
    // point:   1  2  3  4  5  6  7  8  9
    // offset:  0  1  1  2  2  3  3  4  4
    expect(tiebreakServerRotationOffset(1)).toBe(0)
    expect(tiebreakServerRotationOffset(2)).toBe(1)
    expect(tiebreakServerRotationOffset(3)).toBe(1)
    expect(tiebreakServerRotationOffset(4)).toBe(2)
    expect(tiebreakServerRotationOffset(5)).toBe(2)
    expect(tiebreakServerRotationOffset(6)).toBe(3)
    expect(tiebreakServerRotationOffset(7)).toBe(3)
  })

  it('continues the same serveOrder rotation, starting from the next-in-line server', () => {
    const order = ['A', 'B', 'C', 'D']
    // Tiebreak starts after 8 games (4-4), so the next server in rotation is order[8 % 4] = A.
    const gamesCompletedBeforeTiebreak = 8
    expect(tiebreakServer(order, gamesCompletedBeforeTiebreak, 1)).toBe('A')
    expect(tiebreakServer(order, gamesCompletedBeforeTiebreak, 2)).toBe('B')
    expect(tiebreakServer(order, gamesCompletedBeforeTiebreak, 3)).toBe('B')
    expect(tiebreakServer(order, gamesCompletedBeforeTiebreak, 4)).toBe('C')
    expect(tiebreakServer(order, gamesCompletedBeforeTiebreak, 5)).toBe('C')
    expect(tiebreakServer(order, gamesCompletedBeforeTiebreak, 6)).toBe('D')
    expect(tiebreakServer(order, gamesCompletedBeforeTiebreak, 7)).toBe('D')
  })

  it('side alternates each tiebreak point, starting Direita on point 1', () => {
    // pointsCompleted before point N is N-1.
    expect(serveSide(0)).toBe('Direita') // before point 1
    expect(serveSide(1)).toBe('Esquerda') // before point 2
    expect(serveSide(2)).toBe('Direita') // before point 3
    expect(serveSide(5)).toBe('Esquerda') // before point 6
  })
})
