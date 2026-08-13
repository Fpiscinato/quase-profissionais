import { useEffect, useState } from 'react'
import { ensurePlayersSeeded, getSettings, updateSettings } from './db/db'
import { useSettings } from './db/hooks'
import { TournamentWizard } from './features/tournament/TournamentWizard'
import { QuickMatchScreen } from './features/quickmatch/QuickMatchScreen'
import { PlayersScreen } from './features/players/PlayersScreen'
import { RankingScreen } from './features/ranking/RankingScreen'
import { HistoryScreen } from './features/history/HistoryScreen'
import { GuideScreen } from './features/guide/GuideScreen'
import { ManualScreen } from './features/guide/ManualScreen'
import { BackupScreen } from './features/backup/BackupScreen'
import { HomeScreen, type View } from './features/home/HomeScreen'
import { KeyBindingsScreen } from './features/keys/KeyBindingsScreen'
import { voiceCommandsSupported } from './features/voice/useVoiceCommands'
import { resolveEffectiveLayout, TABLET_MIN_WIDTH_QUERY } from './features/match/layoutMode'
import { useMatchMedia } from './lib/useMatchMedia'
import { useT } from './i18n/useT'
import type { Lang } from './i18n/i18n'
import { APP_VERSION } from './version'

// Cycled through by tapping the speed button — covers "a bit faster" up to
// noticeably quick without needing a slider for such a small control.
const VOICE_RATES = [1, 1.25, 1.5, 1.75, 2]

function nextVoiceRate(current: number): number {
  const index = VOICE_RATES.indexOf(current)
  return VOICE_RATES[(index + 1) % VOICE_RATES.length] ?? 1
}

/**
 * Hands-free voice mode: on the live match screen this speaks score/serve
 * updates. It's a device-local setting (like language) so it can be toggled
 * here without leaving the screen you're on — most matches are played with
 * it off. The speed button and the separate "Comandos" (listening) toggle
 * only show up once speaking is on, to save space in an already tight
 * header. Comandos is its own toggle (not tied to Voz) because on-court
 * testing found speech recognition unreliable while speaking worked well —
 * it defaults off so nobody gets surprised by a mic listening they didn't
 * ask for.
 */
function VoiceToggle() {
  const { t } = useT()
  const settings = useSettings()
  const voiceOn = settings?.voiceMode ?? false
  const commandsOn = settings?.voiceCommandsEnabled ?? false
  const rate = settings?.voiceRate ?? 1.5
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        aria-pressed={voiceOn}
        aria-label={t('Modo viva-voz')}
        onClick={() => updateSettings({ voiceMode: !voiceOn })}
        className={`flex min-h-7 items-center gap-1 rounded-md border px-1.5 text-xs font-bold ${
          voiceOn ? 'border-lime bg-lime text-navy' : 'border-cream/20 text-cream/50'
        }`}
      >
        <span aria-hidden="true">🎙</span> {voiceOn ? t('Voz: ON') : t('Voz: OFF')}
      </button>
      {voiceOn && (
        <button
          type="button"
          aria-label={t('Velocidade da voz')}
          onClick={async () => {
            // Reads the DB directly (not the `rate` in this closure) so a
            // quick double-tap can't read a stale value and lose a step
            // while the previous write is still propagating through
            // useLiveQuery.
            const current = await getSettings()
            await updateSettings({ voiceRate: nextVoiceRate(current.voiceRate ?? 1.5) })
          }}
          className="flex min-h-7 items-center rounded-md border border-cream/20 px-1.5 text-xs font-bold text-cream/50"
        >
          {rate}x
        </button>
      )}
      {voiceOn && voiceCommandsSupported() && (
        <button
          type="button"
          aria-pressed={commandsOn}
          aria-label={t('Comandos de voz')}
          onClick={() => updateSettings({ voiceCommandsEnabled: !commandsOn })}
          className={`flex min-h-7 items-center gap-1 rounded-md border px-1.5 text-xs font-bold ${
            commandsOn ? 'border-lime bg-lime text-navy' : 'border-cream/20 text-cream/50'
          }`}
        >
          <span aria-hidden="true">🎤</span> {commandsOn ? t('Comandos: ON') : t('Comandos: OFF')}
        </button>
      )}
    </div>
  )
}

function LangToggle() {
  const { lang, setLang } = useT()
  const option = (value: Lang, label: string) => (
    <button
      type="button"
      aria-pressed={lang === value}
      onClick={() => setLang(value)}
      className={`min-h-7 rounded-md px-2 text-xs font-bold ${
        lang === value ? 'bg-lime text-navy' : 'text-cream/50'
      }`}
    >
      {label}
    </button>
  )
  return (
    <div className="flex gap-1 rounded-lg border border-cream/20 p-0.5">
      {option('pt', 'PT')}
      {option('en', 'EN')}
    </div>
  )
}

/**
 * The header used to lay Voz/Comandos/PT-EN out inline, which made the
 * header's own height change (and everything below it jump) whenever a
 * toggle appeared/disappeared — most noticeably turning Voz on while on a
 * narrow phone. Collapsing everything behind one fixed-size "Opções" button
 * that opens an absolutely-positioned panel (doesn't push layout, just
 * overlays) fixes that at the root: the header's box never changes size
 * regardless of what's open inside the panel.
 */
function HeaderOptions() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="relative z-30 ml-auto flex items-center gap-2">
        <span className="font-mono text-[10px] text-cream/30">v{APP_VERSION}</span>
        <button
          type="button"
          aria-expanded={open}
          aria-label={t('Opções')}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-9 items-center gap-1 rounded-full border border-cream/20 px-3 text-sm font-bold text-cream/80 active:opacity-80"
        >
          <span aria-hidden="true">⚙</span> {t('Opções')}
        </button>
        {open && (
          <div className="absolute right-0 top-full z-30 mt-2 flex w-max flex-col gap-2 rounded-xl border border-cream/10 bg-navy-light p-3 shadow-lg">
            <VoiceToggle />
            <LangToggle />
          </div>
        )}
      </div>
      {/* Sibling, not a child of the z-30 wrapper above — nesting it there
          put it in the same stacking context as the button, so its z-10
          (meant only to sit above ordinary page content) ended up painting
          OVER the button locally and swallowing the click that should close
          the panel. As a sibling of a lower ambient z-index, it stays below
          the wrapper everywhere while still catching outside clicks. */}
      {open && (
        <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setOpen(false)} />
      )}
    </>
  )
}

function App() {
  const [view, setView] = useState<View>('home')
  const [ready, setReady] = useState(false)
  const { t } = useT()
  const settings = useSettings()
  const isWideViewport = useMatchMedia(TABLET_MIN_WIDTH_QUERY)
  const effectiveLayout = resolveEffectiveLayout(settings?.layoutMode ?? 'auto', isWideViewport)

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
    <div
      className={`mx-auto min-h-svh ${effectiveLayout === 'tablet' ? 'max-w-[min(95vw,1600px)]' : 'max-w-md'}`}
    >
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-cream/10 bg-navy px-4 py-1.5">
        {view !== 'home' && (
          <button
            type="button"
            className="flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-lime pl-1 pr-3 text-sm font-bold text-navy active:opacity-80"
            onClick={() => setView('home')}
          >
            <img src="/logo.png" alt="" className="h-7 w-7 rounded-full object-cover" />
            {t('‹ Início')}
          </button>
        )}
        <HeaderOptions />
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
      {view === 'atalhos' && <KeyBindingsScreen />}
    </div>
  )
}

export default App
