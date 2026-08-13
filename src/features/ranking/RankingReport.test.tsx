// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { RankingReport, type RankingReportProps } from './RankingReport'

afterEach(cleanup)

const baseProps: RankingReportProps = {
  scopeLabel: 'Ranking geral',
  generatedAtLabel: '13/08/2026',
  individualStandings: [
    { playerId: 'p1', matchesPlayed: 2, matchesWon: 2, gamesWon: 8, gamesLost: 3, pointsWon: 33, pointsLost: 20 },
    { playerId: 'p2', matchesPlayed: 2, matchesWon: 0, gamesWon: 3, gamesLost: 8, pointsWon: 20, pointsLost: 33 },
  ],
  teamStandings: [
    {
      playerIds: ['p1', 'p3'],
      matchesPlayed: 1,
      matchesWon: 1,
      gamesWon: 4,
      gamesLost: 1,
      pointsWon: 16,
      pointsLost: 8,
    },
  ],
  playerTimes: [{ playerId: 'p1', totalSeconds: 3600, matchesPlayed: 2 }],
  teamTimes: [{ playerIds: ['p1', 'p3'], totalSeconds: 1800, matchesPlayed: 1 }],
  totalSeconds: 5400,
  playerName: (id) => ({ p1: 'Jarede', p2: 'Mateus', p3: 'Emerson' })[id] ?? '?',
  teamName: (ids) => ids.map((id) => ({ p1: 'Jarede', p2: 'Mateus', p3: 'Emerson' })[id] ?? '?').join(' & '),
}

describe('RankingReport (pure presentational component)', () => {
  it('renders both Individual and Duplas tables plus the tempo jogado summary', () => {
    render(<RankingReport {...baseProps} />)

    expect(screen.getByText('Ranking geral')).toBeInTheDocument()
    expect(screen.getByText('Individual')).toBeInTheDocument()
    expect(screen.getByText('Duplas')).toBeInTheDocument()
    expect(screen.getAllByText('Jarede').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Jarede & Emerson').length).toBeGreaterThan(0)
    expect(screen.getByText('1h 30min')).toBeInTheDocument() // totalSeconds formatted
  })

  it('shows a placeholder when a table has no rows yet', () => {
    render(<RankingReport {...baseProps} teamStandings={[]} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
