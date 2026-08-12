import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../../db/db'
import { useSettings } from '../../db/hooks'
import { useT } from '../../i18n/useT'
import { card, secondaryButton } from '../../ui/styles'
import { KEY_ACTIONS, type KeyActionId } from './actions'

export function KeyBindingsScreen() {
  const { t } = useT()
  const settings = useSettings()
  const bindings = settings?.keyBindings ?? {}
  const [capturing, setCapturing] = useState<KeyActionId | null>(null)

  useEffect(() => {
    if (!capturing) return

    const handler = async (event: KeyboardEvent) => {
      event.preventDefault()
      if (event.code === 'Escape') {
        setCapturing(null)
        return
      }
      // Reads the DB directly (not `bindings` from the closure) to avoid
      // acting on a stale value — same rationale as the voice speed button.
      const current = await getSettings()
      const next: Record<string, string> = { ...current.keyBindings }
      // A physical key can only drive one action — clear it from wherever
      // else it was bound before assigning it here.
      for (const id of Object.keys(next)) {
        if (next[id] === event.code) delete next[id]
      }
      next[capturing] = event.code
      await updateSettings({ keyBindings: next })
      setCapturing(null)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [capturing])

  const clearBinding = async (id: KeyActionId) => {
    const current = await getSettings()
    const next = { ...current.keyBindings }
    delete next[id]
    await updateSettings({ keyBindings: next })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">{t('Controle remoto')}</h1>
        <p className="text-sm text-cream/70">
          {t(
            'Mapeie as teclas de um controle físico (ex. um "clicker" de apresentação USB) para marcar pontos e outros comandos sem tocar no aparelho. Funciona com qualquer controle que emule teclado, não só um modelo específico.',
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {KEY_ACTIONS.map((action) => {
          const boundCode = bindings[action.id]
          const isCapturing = capturing === action.id
          return (
            <div key={action.id} className={`${card} flex items-center justify-between gap-2`}>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-cream">{t(action.label)}</span>
                {isCapturing ? (
                  <span className="text-sm text-lime">{t('Aguardando tecla... (Esc para cancelar)')}</span>
                ) : boundCode ? (
                  <span className="w-fit rounded border border-cream/30 bg-navy px-2 py-0.5 font-mono text-xs text-cream/80">
                    {boundCode}
                  </span>
                ) : (
                  <span className="text-sm italic text-cream/50">{t('Não definida')}</span>
                )}
              </div>
              <div className="flex gap-2">
                {boundCode && !isCapturing && (
                  <button
                    type="button"
                    className={secondaryButton}
                    onClick={() => clearBinding(action.id)}
                  >
                    {t('Limpar')}
                  </button>
                )}
                <button
                  type="button"
                  className={secondaryButton}
                  disabled={isCapturing}
                  onClick={() => setCapturing(action.id)}
                >
                  {t('Definir')}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
