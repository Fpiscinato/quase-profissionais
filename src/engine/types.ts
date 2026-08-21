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
  /** Sets needed to win the match: 1 = single set, 2 = melhor de 3, 3 = melhor de 5 (Grand Slam). Default 1. */
  setsToWinMatch: 1 | 2 | 3
  /** Points needed to win the deciding-set super-tiebreak (only used when setsToWinMatch > 1 and the match reaches a decider). Win by 2. Default 10. */
  superTiebreakPoints: number
}

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  gamesToWinSet: 4,
  tiebreakPoints: 7,
  deuceMode: 'advantage',
  setsToWinMatch: 1,
  superTiebreakPoints: 10,
}

/** One entry per point played, in chronological order, for the whole match (across every set). */
export type PointLog = TeamSide[]

/**
 * A completed set's result. For a normal set, games1/games2 are the final games score
 * (matching isSetOver's finalGames1/finalGames2). For the deciding set of a best-of-3/5
 * match decided by a super-tiebreak (see MatchConfig.superTiebreakPoints), there are no
 * games at all — games1/games2 instead hold the tiebreak's own point score, and
 * superTiebreak is true so callers know not to treat it as a games count.
 */
export interface SetResult {
  games1: number
  games2: number
  winner: TeamSide
  superTiebreak?: boolean
}

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
  /** Completed games won by each side in the CURRENT set (does not include the in-progress game). Resets to 0 at the start of every new set. */
  games1: number
  games2: number
  /** Points in the game currently being played (0 once a tiebreak starts). */
  currentGame: GameScore
  /** Set once games1 and games2 both equal config.gamesToWinSet, or the whole current set is a deciding super-tiebreak. */
  isTiebreak: boolean
  /** Points in the current tiebreak, if isTiebreak is true. */
  tiebreak: TiebreakScore
  /** True while the current set is itself the deciding super-tiebreak of a best-of-3/5 match (see SetResult.superTiebreak), and also once the match has just ended via that super-tiebreak (so the frozen score shown behind matchOverCard is still the real final tiebreak score, not a stale games score). Implies isTiebreak. */
  isDecidingSuperTiebreak: boolean
  /** Sets already finished, in order played. */
  completedSets: SetResult[]
  /** Sets won so far by each side (== completedSets filtered by winner). */
  sets1: number
  sets2: number
  /** True once the match is decided (enough sets won, or the deciding super-tiebreak is over). */
  isMatchOver: boolean
  winner?: TeamSide
  /** Final recorded games score of the last/deciding set, e.g. 5-4 after a tiebreak. Only set once isMatchOver. For a single-set match (setsToWinMatch: 1) this is the whole match's final score, same as before this field existed. */
  finalGames1?: number
  finalGames2?: number
  /** Total games completed across the WHOLE match so far (never resets between sets) — drives change-of-ends and serve rotation, which continue seamlessly across set boundaries per the official rules. */
  totalGamesCompleted: number
  /** Total points played across the whole match (every set, games + tiebreaks). */
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
  /** Sets won by each side. For matches with no set data (legacy single-set rows), this is 1/0 or 0/1 based on winnerTeam. */
  sets1: number
  sets2: number
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
  setsWon: number
  setsLost: number
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
  setsWon: number
  setsLost: number
}
