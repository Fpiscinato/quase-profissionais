import { updateSettings } from '../db/db'
import { useSettings } from '../db/hooks'
import { makeTranslator, type Lang, type Translator } from './i18n'

/**
 * Language is stored on AppSettingsRow (device-local, like currentTournamentId),
 * so it persists via the same Dexie liveQuery reactivity already used
 * app-wide — no separate context/provider needed.
 */
export function useT(): { t: Translator; lang: Lang; setLang: (lang: Lang) => void } {
  const settings = useSettings()
  const lang: Lang = settings?.lang ?? 'pt'
  return {
    t: makeTranslator(lang),
    lang,
    setLang: (next) => {
      updateSettings({ lang: next })
    },
  }
}
