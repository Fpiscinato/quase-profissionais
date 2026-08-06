import { useEffect, useState } from 'react'
import { ensurePlayersSeeded, getSettings } from './db/db'
import { TournamentWizard } from './features/tournament/TournamentWizard'
import { QuickMatchScreen } from './features/quickmatch/QuickMatchScreen'
import { PlayersScreen } from './features/players/PlayersScreen'
import { RankingScreen } from './features/ranking/RankingScreen'
import { HistoryScreen } from './features/history/HistoryScreen'
import { GuideScreen } from './features/guide/GuideScreen'
import { ManualScreen } from './features/guide/ManualScreen'
import { BackupScreen } from './features/backup/BackupScreen'
import { HomeScreen, type View } from './features/home/HomeScreen'
import { useT } from './i18n/useT'
import type { Lang } from './i18n/i18n'

function LangToggle() {
  const { lang, setLang } = useT()
  const option = (value: Lang, label: string) => (
    <button
      type="button"
      aria-pressed={lang === value}
      onClick={() => setLang(value)}
      className={`min-h-8 rounded-md px-2 text-xs font-bold ${
        lang === value ? 'bg-lime text-navy' : 'text-cream/50'
      }`}
    >
      {label}
    </button>
  )
  return (
    <div className="ml-auto flex gap-1 rounded-lg border border-cream/20 p-0.5">
      {option('pt', 'PT')}
      {option('en', 'EN')}
    </div>
  )
}

function App() {
  const [view, setView] = useState<View>('home')
  const [ready, setReady] = useState(false)
  const { t } = useT()

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
    return <div className="p-4 text-cream/70">{t('Carregando...')}</div>
  }

  return (
    <div className="mx-auto min-h-svh max-w-md">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-cream/10 bg-navy p-4">
        {view !== 'home' && (
          <button
            type="button"
            className="flex min-h-9 items-center gap-2 rounded-full bg-lime pl-1 pr-3 text-sm font-bold text-navy active:opacity-80"
            onClick={() => setView('home')}
          >
            <img src="/logo.png" alt="" className="h-7 w-7 rounded-full object-cover" />
            {t('‹ Início')}
          </button>
        )}
        <LangToggle />
      </header>
      {view === 'home' && <HomeScreen onNavigate={setView} />}
      {view === 'torneio' && <TournamentWizard onExit={() => setView('home')} />}
      {view === 'partida-avulsa' && (
        <QuickMatchScreen onCreated={() => setView('torneio')} onBack={() => setView('home')} />
      )}
      {view === 'jogadores' && <PlayersScreen />}
      {view === 'ranking' && <RankingScreen />}
      {view === 'historico' && <HistoryScreen />}
      {view === 'guia' && <GuideScreen />}
      {view === 'manual' && <ManualScreen />}
      {view === 'backup' && <BackupScreen />}
    </div>
  )
}

export default App
