import type { GameScore, MatchConfig, MatchState, PointLog, TeamSide, TiebreakScore } from './types'

function winnerOf(a: number, b: number): TeamSide {
  return a > b ? 'team1' : 'team2'
}

/**
 * A "race to N, win by 2" result, used both for the golden-point-less tiebreak
 * and (in advantage mode) for the regular game.
 */
function raceOver(
  a: number,
  b: number,
  target: number,
): { over: boolean; winner?: TeamSide } {
  const max = Math.max(a, b)
  const diff = Math.abs(a - b)
  if (max >= target && diff >= 2) {
    return { over: true, winner: winnerOf(a, b) }
  }
  return { over: false }
}

/** Game: 40-40 (both >=3 points) needs 2 straight points unless golden point is on. */
export function isGameOver(
  game: GameScore,
  deuceMode: MatchConfig['deuceMode'],
): { over: boolean; winner?: TeamSide } {
  const { points1, points2 } = game
  const max = Math.max(points1, points2)
  const min = Math.min(points1, points2)
  if (max < 4) return { over: false }
  if (min <= 2) return { over: true, winner: winnerOf(points1, points2) }
  // Both sides have reached deuce territory (>= 3 points, i.e. 40-40 or later).
  if (deuceMode === 'goldenPoint') {
    if (points1 === points2) return { over: false }
    return { over: true, winner: winnerOf(points1, points2) }
  }
  return raceOver(points1, points2, 4)
}

/** Tiebreak is always win-by-2, first to config.tiebreakPoints; golden point does not apply. */
export function isTiebreakOver(
  tiebreak: TiebreakScore,
  tiebreakPoints: number,
): { over: boolean; winner?: TeamSide } {
  return raceOver(tiebreak.points1, tiebreak.points2, tiebreakPoints)
}

/** True once both sides have reached config.gamesToWinSet games (set-all). */
export function isTiebreak(games1: number, games2: number, config: MatchConfig): boolean {
  return games1 === config.gamesToWinSet && games2 === config.gamesToWinSet
}

export interface SetOverResult {
  over: boolean
  winner?: TeamSide
  finalGames1?: number
  finalGames2?: number
}

/**
 * Whether the set is decided. Outside a tiebreak this is first-to-gamesToWinSet
 * win by 2. Inside a tiebreak, the winner is additionally credited one more
 * game, so a tiebreak won by the trailing side records e.g. 5-4.
 */
export function isSetOver(
  games1: number,
  games2: number,
  tiebreak: TiebreakScore,
  config: MatchConfig,
): SetOverResult {
  if (isTiebreak(games1, games2, config)) {
    const tb = isTiebreakOver(tiebreak, config.tiebreakPoints)
    if (!tb.over) return { over: false }
    return {
      over: true,
      winner: tb.winner,
      finalGames1: tb.winner === 'team1' ? games1 + 1 : games1,
      finalGames2: tb.winner === 'team2' ? games2 + 1 : games2,
    }
  }
  const result = raceOver(games1, games2, config.gamesToWinSet)
  if (!result.over) return { over: false }
  return { over: true, winner: result.winner, finalGames1: games1, finalGames2: games2 }
}

/**
 * Replays the full point log and derives the current match state. Called on
 * every render/tap so the UI never keeps score in its own state.
 */
export function computeMatchState(pointLog: PointLog, config: MatchConfig): MatchState {
  let games1 = 0
  let games2 = 0
  let currentGame: GameScore = { points1: 0, points2: 0 }
  let tiebreak: TiebreakScore = { points1: 0, points2: 0 }
  let tbActive = false
  let totalGamesCompleted = 0
  let isMatchOver = false
  let winner: TeamSide | undefined
  let finalGames1: number | undefined
  let finalGames2: number | undefined

  for (const point of pointLog) {
    if (isMatchOver) break

    if (tbActive) {
      if (point === 'team1') tiebreak.points1++
      else tiebreak.points2++

      const setResult = isSetOver(games1, games2, tiebreak, config)
      if (setResult.over) {
        isMatchOver = true
        winner = setResult.winner
        finalGames1 = setResult.finalGames1
        finalGames2 = setResult.finalGames2
        totalGamesCompleted++
      }
      continue
    }

    if (point === 'team1') currentGame.points1++
    else currentGame.points2++

    const gameResult = isGameOver(currentGame, config.deuceMode)
    if (gameResult.over) {
      if (gameResult.winner === 'team1') games1++
      else games2++
      totalGamesCompleted++
      currentGame = { points1: 0, points2: 0 }

      if (isTiebreak(games1, games2, config)) {
        tbActive = true
      } else {
        const setResult = isSetOver(games1, games2, tiebreak, config)
        if (setResult.over) {
          isMatchOver = true
          winner = setResult.winner
          finalGames1 = setResult.finalGames1
          finalGames2 = setResult.finalGames2
        }
      }
    }
  }

  return {
    games1,
    games2,
    currentGame,
    isTiebreak: tbActive,
    tiebreak,
    isMatchOver,
    winner,
    finalGames1,
    finalGames2,
    totalGamesCompleted,
    totalPointsPlayed: pointLog.length,
  }
}

/**
 * Appends a point to the log. No-ops once the match is already decided, so
 * the live screen can safely block further taps by just calling this again.
 */
export function applyPoint(pointLog: PointLog, winner: TeamSide, config: MatchConfig): PointLog {
  const state = computeMatchState(pointLog, config)
  if (state.isMatchOver) return pointLog
  return [...pointLog, winner]
}
