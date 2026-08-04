import { useState } from 'react'
import { TournamentWizard } from './features/tournament/TournamentWizard'
import { PlayersScreen } from './features/players/PlayersScreen'

type View = 'torneio' | 'jogadores'

function App() {
  const [view, setView] = useState<View>('torneio')

  return (
    <div className="mx-auto min-h-svh max-w-md">
      <header className="flex items-center justify-between border-b border-cream/10 p-4">
        <span className="font-bold">Os Quase Profissionais</span>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-cream/30 px-3 py-1 text-sm font-semibold"
          onClick={() => setView(view === 'torneio' ? 'jogadores' : 'torneio')}
        >
          {view === 'torneio' ? 'Jogadores' : 'Torneio'}
        </button>
      </header>
      {view === 'torneio' ? <TournamentWizard /> : <PlayersScreen />}
    </div>
  )
}

export default App
