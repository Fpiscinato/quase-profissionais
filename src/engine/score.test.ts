import { describe, expect, it } from 'vitest'
import { applyPoint, computeMatchState, isGameOver, isSetOver, isTiebreak, isTiebreakOver } from './score'
import { shouldChangeEnds } from './serve'
import { DEFAULT_MATCH_CONFIG } from './types'
import type { MatchConfig, PointLog, TeamSide } from './types'

const config = DEFAULT_MATCH_CONFIG

function play(winners: TeamSide[], cfg: MatchConfig = config) {
  let log: PointLog = []
  for (const w of winners) log = applyPoint(log, w, cfg)
  return log
}

describe('isGameOver — advantage (default) mode', () => {
  it('is not over below 4 points', () => {
    expect(isGameOver({ points1: 3, points2: 0 }, 'advantage').over).toBe(false)
  })

  it('wins outright at 4 points with a 2+ margin (e.g. 4-1)', () => {
    const result = isGameOver({ points1: 4, points2: 1 }, 'advantage')
    expect(result).toEqual({ over: true, winner: 'team1' })
  })

  it('4-3 is not over — no 2-point margin yet (deuce continues)', () => {
    expect(isGameOver({ points1: 4, points2: 3 }, 'advantage').over).toBe(false)
  })

  it('40-40 (3-3) is not over', () => {
    expect(isGameOver({ points1: 3, points2: 3 }, 'advantage').over).toBe(false)
  })

  it('needs 2 straight points from deuce: advantage alone (4-3) does not win', () => {
    expect(isGameOver({ points1: 4, points2: 3 }, 'advantage').over).toBe(false)
  })

  it('wins after 2 straight points from deuce (5-3)', () => {
    const result = isGameOver({ points1: 5, points2: 3 }, 'advantage')
    expect(result).toEqual({ over: true, winner: 'team1' })
  })

  it('can go beyond deuce indefinitely until a 2-point margin appears', () => {
    expect(isGameOver({ points1: 5, points2: 4 }, 'advantage').over).toBe(false)
    expect(isGameOver({ points1: 6, points2: 4 }, 'advantage').over).toEqual(true)
  })
})

describe('isGameOver — golden point (no-ad) mode', () => {
  it('below deuce behaves like advantage mode', () => {
    expect(isGameOver({ points1: 4, points2: 1 }, 'goldenPoint')).toEqual({
      over: true,
      winner: 'team1',
    })
    expect(isGameOver({ points1: 3, points2: 2 }, 'goldenPoint').over).toBe(false)
  })

  it('at 40-40 (3-3), the very next point decides the game — no 2-point margin needed', () => {
    expect(isGameOver({ points1: 3, points2: 3 }, 'goldenPoint').over).toBe(false)
    expect(isGameOver({ points1: 4, points2: 3 }, 'goldenPoint')).toEqual({
      over: true,
      winner: 'team1',
    })
  })
})

describe('applyPoint / computeMatchState — full game and set flow', () => {
  it('plays a simple 4-0 game', () => {
    const log = play(['team1', 'team1', 'team1', 'team1'])
    const state = computeMatchState(log, config)
    expect(state.games1).toBe(1)
    expect(state.games2).toBe(0)
    expect(state.currentGame).toEqual({ points1: 0, points2: 0 })
  })

  it('plays a deuce game requiring 2 straight points to close (40-40 then AD then game)', () => {
    const log = play([
      'team1', 'team2', 'team1', 'team2', 'team1', 'team2', // 3-3 (40-40)
      'team1', // advantage team1 (4-3), not over yet
      'team1', // 5-3, wins by 2
    ])
    const state = computeMatchState(log, config)
    expect(state.games1).toBe(1)
    expect(state.games2).toBe(0)
  })

  it('a single set is first to 4 games by 2 (e.g. 4-1)', () => {
    const winGame = (side: TeamSide): TeamSide[] => [side, side, side, side]
    const log = play([
      ...winGame('team1'),
      ...winGame('team2'),
      ...winGame('team1'),
      ...winGame('team1'),
      ...winGame('team1'),
    ])
    const state = computeMatchState(log, config)
    expect(state.isMatchOver).toBe(true)
    expect(state.winner).toBe('team1')
    expect(state.finalGames1).toBe(4)
    expect(state.finalGames2).toBe(1)
  })

  it('reaching 4-4 in games triggers a tiebreak instead of continuing normal games', () => {
    const winGame = (side: TeamSide): TeamSide[] => [side, side, side, side]
    const log = play([
      ...winGame('team1'),
      ...winGame('team2'),
      ...winGame('team1'),
      ...winGame('team2'),
      ...winGame('team1'),
      ...winGame('team2'),
      ...winGame('team1'),
      ...winGame('team2'),
    ])
    const state = computeMatchState(log, config)
    expect(state.games1).toBe(4)
    expect(state.games2).toBe(4)
    expect(state.isTiebreak).toBe(true)
    expect(state.isMatchOver).toBe(false)
    expect(isTiebreak(4, 4, config)).toBe(true)
  })

  it('tiebreak is first to 7 win by 2, and the set is recorded 5-4 for the tiebreak winner', () => {
    const winGame = (side: TeamSide): TeamSide[] => [side, side, side, side]
    const toSetAll = [
      ...winGame('team1'),
      ...winGame('team2'),
      ...winGame('team1'),
      ...winGame('team2'),
      ...winGame('team1'),
      ...winGame('team2'),
      ...winGame('team1'),
      ...winGame('team2'),
    ]
    const tiebreakPoints: TeamSide[] = [
      'team2', 'team2', 'team2', 'team2', 'team2', 'team2', 'team2', // 0-7
    ]
    const log = play([...toSetAll, ...tiebreakPoints])
    const state = computeMatchState(log, config)
    expect(state.isMatchOver).toBe(true)
    expect(state.winner).toBe('team2')
    expect(state.finalGames1).toBe(4)
    expect(state.finalGames2).toBe(5)
  })

  it('tiebreak also requires a 2-point margin (7-6 is not enough)', () => {
    const tb = isTiebreakOver({ points1: 7, points2: 6 }, 7)
    expect(tb.over).toBe(false)
    const tbWon = isTiebreakOver({ points1: 8, points2: 6 }, 7)
    expect(tbWon).toEqual({ over: true, winner: 'team1' })
  })

  it('blocks further points once the match is decided (applyPoint is a no-op)', () => {
    const winGame = (side: TeamSide): TeamSide[] => [side, side, side, side]
    const log = play([
      ...winGame('team1'),
      ...winGame('team1'),
      ...winGame('team1'),
      ...winGame('team1'),
    ])
    const stateBefore = computeMatchState(log, config)
    expect(stateBefore.isMatchOver).toBe(true)

    const logAfterExtraPoint = applyPoint(log, 'team2', config)
    expect(logAfterExtraPoint).toBe(log) // same reference: no-op
    expect(logAfterExtraPoint.length).toBe(log.length)
  })
})

describe('isSetOver', () => {
  it('is not over below gamesToWinSet', () => {
    expect(isSetOver(3, 2, { points1: 0, points2: 0 }, config).over).toBe(false)
  })

  it('is over at 4-2 (win by 2)', () => {
    const result = isSetOver(4, 2, { points1: 0, points2: 0 }, config)
    expect(result).toEqual({ over: true, winner: 'team1', finalGames1: 4, finalGames2: 2 })
  })

  it('is not over at 4-3 (no margin yet, keeps playing)', () => {
    expect(isSetOver(4, 3, { points1: 0, points2: 0 }, config).over).toBe(false)
  })

  it('at 4-4 with an undecided tiebreak, the set is not over', () => {
    expect(isSetOver(4, 4, { points1: 3, points2: 2 }, config).over).toBe(false)
  })
})

describe('6-game set ("Padrão reduzido", Section 12: gamesToWinSet=6)', () => {
  const config6: MatchConfig = {
    gamesToWinSet: 6,
    tiebreakPoints: 7,
    deuceMode: 'advantage',
    setsToWinMatch: 1,
    superTiebreakPoints: 10,
  }
  const winGame = (side: TeamSide): TeamSide[] => [side, side, side, side]

  // 12 games alternating team1/team2 (4-0 each), so after game k, totalGamesCompleted === k.
  // Games 1,3,5,7,9,11 go to team1; games 2,4,6,8,10,12 go to team2 -> 6-6 after game 12.
  const fullLog = play(
    Array.from({ length: 12 }, (_, i) => winGame(i % 2 === 0 ? 'team1' : 'team2')).flat(),
    config6,
  )

  it.each([1, 3, 5, 7, 9, 11])('changes ends after game %i (odd total games)', (gameNumber) => {
    const prefix = fullLog.slice(0, gameNumber * 4)
    const state = computeMatchState(prefix, config6)
    expect(state.totalGamesCompleted).toBe(gameNumber)
    expect(
      shouldChangeEnds({
        isTiebreak: state.isTiebreak,
        totalGamesCompleted: state.totalGamesCompleted,
        tiebreakPointsCompleted: state.tiebreak.points1 + state.tiebreak.points2,
      }),
    ).toBe(true)
  })

  it.each([2, 4, 6, 8, 10])('does not change ends after game %i (even total games)', (gameNumber) => {
    const prefix = fullLog.slice(0, gameNumber * 4)
    const state = computeMatchState(prefix, config6)
    expect(state.totalGamesCompleted).toBe(gameNumber)
    expect(
      shouldChangeEnds({
        isTiebreak: state.isTiebreak,
        totalGamesCompleted: state.totalGamesCompleted,
        tiebreakPointsCompleted: state.tiebreak.points1 + state.tiebreak.points2,
      }),
    ).toBe(false)
  })

  it('reaching 6-6 triggers a tiebreak, not a 13th normal game', () => {
    const prefix = fullLog.slice(0, 12 * 4)
    const state = computeMatchState(prefix, config6)
    expect(state.games1).toBe(6)
    expect(state.games2).toBe(6)
    expect(state.isTiebreak).toBe(true)
    expect(state.isMatchOver).toBe(false)
    expect(isTiebreak(6, 6, config6)).toBe(true)
  })
})

describe('Deuce mode parameterization (Section 12) — wired end-to-end via computeMatchState', () => {
  const toDeuce: TeamSide[] = ['team1', 'team2', 'team1', 'team2', 'team1', 'team2'] // 3-3 (40-40)

  it('advantage mode (default): the point right after 40-40 does NOT end the game', () => {
    const log = play([...toDeuce, 'team1'], DEFAULT_MATCH_CONFIG)
    const state = computeMatchState(log, DEFAULT_MATCH_CONFIG)
    expect(state.games1).toBe(0)
    expect(state.currentGame).toEqual({ points1: 4, points2: 3 })
  })

  it('golden point mode: the same log ends the game immediately at 40-40 (no-ad)', () => {
    const goldenPointConfig: MatchConfig = {
      gamesToWinSet: 4,
      tiebreakPoints: 7,
      deuceMode: 'goldenPoint',
      setsToWinMatch: 1,
      superTiebreakPoints: 10,
    }
    const log = play([...toDeuce, 'team1'], goldenPointConfig)
    const state = computeMatchState(log, goldenPointConfig)
    expect(state.games1).toBe(1)
    expect(state.games2).toBe(0)
    expect(state.currentGame).toEqual({ points1: 0, points2: 0 })
  })
})

describe('Multi-set matches (setsToWinMatch > 1)', () => {
  const bestOf3: MatchConfig = {
    gamesToWinSet: 4,
    tiebreakPoints: 7,
    deuceMode: 'advantage',
    setsToWinMatch: 2,
    superTiebreakPoints: 10,
  }
  const bestOf5: MatchConfig = { ...bestOf3, setsToWinMatch: 3 }

  // A team winning a set 4-0 straight, with default gamesToWinSet=4: 4 games
  // of 4 straight points each, 16 points total, no need to reach deuce.
  const winSetStraight = (side: TeamSide): TeamSide[] => Array(16).fill(side)

  it('ends the match once a side reaches setsToWinMatch sets (best-of-3, 2-0)', () => {
    const log = play([...winSetStraight('team1'), ...winSetStraight('team1')], bestOf3)
    const state = computeMatchState(log, bestOf3)
    expect(state.isMatchOver).toBe(true)
    expect(state.winner).toBe('team1')
    expect(state.sets1).toBe(2)
    expect(state.sets2).toBe(0)
    expect(state.completedSets).toEqual([
      { games1: 4, games2: 0, winner: 'team1', superTiebreak: false },
      { games1: 4, games2: 0, winner: 'team1', superTiebreak: false },
    ])
  })

  it('resets games (but not totalGamesCompleted) between sets, without ending the match at 1-1', () => {
    const afterSet1 = play(winSetStraight('team1'), bestOf3)
    const stateAfterSet1 = computeMatchState(afterSet1, bestOf3)
    expect(stateAfterSet1.isMatchOver).toBe(false)
    expect(stateAfterSet1.sets1).toBe(1)
    expect(stateAfterSet1.games1).toBe(0) // reset for the new set
    expect(stateAfterSet1.games2).toBe(0)
    // Cumulative across the match so far (4 games in set 1) — never resets,
    // since change-of-ends/serve rotation continue seamlessly across sets.
    expect(stateAfterSet1.totalGamesCompleted).toBe(4)

    const afterSet2 = play([...afterSet1, ...winSetStraight('team2')], bestOf3)
    const stateAfterSet2 = computeMatchState(afterSet2, bestOf3)
    expect(stateAfterSet2.isMatchOver).toBe(false)
    expect(stateAfterSet2.sets1).toBe(1)
    expect(stateAfterSet2.sets2).toBe(1)
    expect(stateAfterSet2.totalGamesCompleted).toBe(8) // 4 (set 1) + 4 (set 2), still cumulative
  })

  it('a 1-1 best-of-3 goes to a super-tiebreak decider instead of a 3rd full set', () => {
    const afterTwoSets = play(
      [...winSetStraight('team1'), ...winSetStraight('team2')],
      bestOf3,
    )
    const midDecider = play([...afterTwoSets, 'team1', 'team1', 'team1'], bestOf3)
    const state = computeMatchState(midDecider, bestOf3)
    // Deciding set: straight to a tiebreak, no games at all.
    expect(state.isTiebreak).toBe(true)
    expect(state.isDecidingSuperTiebreak).toBe(true)
    expect(state.games1).toBe(0)
    expect(state.games2).toBe(0)
    expect(state.tiebreak).toEqual({ points1: 3, points2: 0 })
    expect(state.isMatchOver).toBe(false)

    // team1 closes it out 10-2 (super-tiebreak target, win by 2).
    const finished = play(
      [...midDecider, 'team1', 'team1', 'team1', 'team1', 'team1', 'team1', 'team2', 'team2', 'team1'],
      bestOf3,
    )
    const finalState = computeMatchState(finished, bestOf3)
    expect(finalState.isMatchOver).toBe(true)
    expect(finalState.winner).toBe('team1')
    expect(finalState.sets1).toBe(2)
    expect(finalState.sets2).toBe(1)
    expect(finalState.completedSets[2]).toEqual({
      games1: 10,
      games2: 2,
      winner: 'team1',
      superTiebreak: true,
    })
  })

  it('best-of-5 needs 3 sets to end the match, not 2', () => {
    const log = play(
      [...winSetStraight('team1'), ...winSetStraight('team1'), ...winSetStraight('team2')],
      bestOf5,
    )
    const state = computeMatchState(log, bestOf5)
    expect(state.isMatchOver).toBe(false)
    expect(state.sets1).toBe(2)
    expect(state.sets2).toBe(1)

    const finished = play([...log, ...winSetStraight('team1')], bestOf5)
    const finalState = computeMatchState(finished, bestOf5)
    expect(finalState.isMatchOver).toBe(true)
    expect(finalState.sets1).toBe(3)
    expect(finalState.completedSets).toHaveLength(4)
  })
})
