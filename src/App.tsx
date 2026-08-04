import { useEffect, useState } from 'react'
import { ensurePlayersSeeded, getSettings } from './db/db'
import { TournamentWizard } from './features/tournament/TournamentWizard'
import { PlayersScreen } from './features/players/PlayersScreen'
import { RankingScreen } from './features/ranking/RankingScreen'
import { HistoryScreen } from './features/history/HistoryScreen'
import { GuideScreen } from './features/guide/GuideScreen'
import { BackupScreen } from './features/backup/BackupScreen'
import { HomeScreen, type View } from './features/home/HomeScreen'

function App() {
  const [view, setView] = useState<View>('home')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Seeded once here (not inside TournamentWizard) since Home lets you
      // reach Jogadores/Ranking/etc. without ever mounting Torneio first.
      await ensurePlayersSeeded()

      // Skip the home landing straight into Torneio if there's a match or
      // tournament to resume — TournamentWizard re-derives the exact step
      // (and falls back to a fresh start if it turns out to be completed).
      const settings = await getSettings()
      if (!cancelled && (settings.currentMatchId || settings.currentTournamentId)) {
        setView('torneio')
      }
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return <div className="p-4 text-cream/70">Carregando...</div>
  }

  return (
    <div className="mx-auto min-h-svh max-w-md">
      {view !== 'home' && (
        <header className="flex items-center gap-3 border-b border-cream/10 p-4">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-semibold text-cream/80"
            onClick={() => setView('home')}
          >
            <img src="/logo.png" alt="" className="h-7 w-7 rounded-full object-cover" />
            ‹ Início
          </button>
        </header>
      )}
      {view === 'home' && <HomeScreen onNavigate={setView} />}
      {view === 'torneio' && <TournamentWizard onExit={() => setView('home')} />}
      {view === 'jogadores' && <PlayersScreen />}
      {view === 'ranking' && <RankingScreen />}
      {view === 'historico' && <HistoryScreen />}
      {view === 'guia' && <GuideScreen />}
      {view === 'backup' && <BackupScreen />}
    </div>
  )
}

export default App
