export type PlayerId = string

export type TeamSide = 'team1' | 'team2'

export type DeuceMode = 'advantage' | 'goldenPoint'

export interface MatchConfig {
  /** Games needed to win a set outright (before tiebreak kicks in at N-N). Default 4. */
  gamesToWinSet: number
  /** Points needed to win the tiebreak, win by 2. Default 7. */
  tiebreakPoints: number
  /** 40-40 behaviour: 'advantage' (win by 2) or 'goldenPoint' (next point decides). */
  deuceMode: DeuceMode
}

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  gamesToWinSet: 4,
  tiebreakPoints: 7,
  deuceMode: 'advantage',
}

/** One entry per point played, in chronological order, for the whole match (single set). */
export type PointLog = TeamSide[]

export type ServeSide = 'Direita' | 'Esquerda'

export interface GameScore {
  points1: number
  points2: number
}

export interface TiebreakScore {
  points1: number
  points2: number
}

/** Full derived state of a match, recomputed from the point log on every read. */
export interface MatchState {
  /** Completed games won by each side (does not include the in-progress game). */
  games1: number
  games2: number
  /** Points in the game currently being played (0 once a tiebreak starts). */
  currentGame: GameScore
  /** Set once games1 and games2 both equal config.gamesToWinSet. */
  isTiebreak: boolean
  /** Points in the current tiebreak, if isTiebreak is true. */
  tiebreak: TiebreakScore
  /** True once the set (and therefore the match) is decided. */
  isMatchOver: boolean
  winner?: TeamSide
  /** Final recorded games score, e.g. 5-4 after a tiebreak. Only set once isMatchOver. */
  finalGames1?: number
  finalGames2?: number
  /** Total games completed in the set so far (used for change-of-ends). */
  totalGamesCompleted: number
  /** Total points played across the whole match (games + tiebreak). */
  totalPointsPlayed: number
}

/** A team is 1 player (singles) or 2 players (doubles). */
export type Team = PlayerId[]

export interface ScheduledMatch {
  roundIndex: number
  team1: Team
  team2: Team
  restingPlayerIds: PlayerId[]
}

export interface MatchResult {
  team1: Team
  team2: Team
  games1: number
  games2: number
  points1: number
  points2: number
  winnerTeam: TeamSide
}

export interface PlayerStanding {
  playerId: PlayerId
  matchesPlayed: number
  matchesWon: number
  gamesWon: number
  gamesLost: number
  pointsWon: number
  pointsLost: number
}

/**
 * Ranking by exact pairing (Team/Dupla) rather than by individual player:
 * credits the specific team of 1 (singles) or 2 (doubles) players that
 * played together, not each player separately. Two matches only count
 * toward the same TeamStanding if the same set of player ids played them
 * together (order-independent).
 */
export interface TeamStanding {
  playerIds: PlayerId[]
  matchesPlayed: number
  matchesWon: number
  gamesWon: number
  gamesLost: number
  pointsWon: number
  pointsLost: number
}
