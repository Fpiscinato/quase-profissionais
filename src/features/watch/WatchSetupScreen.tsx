import { updateSettings } from '../../db/db'
import { useSettings } from '../../db/hooks'
import { generatePin, isRelayConfigured } from './relayConfig'
import { useWatchRelay } from './useWatchRelay'
import { card, primaryButton, secondaryButton, toggleButton } from '../../ui/styles'
import { HelpHint } from '../../ui/HelpHint'
import { useT } from '../../i18n/useT'

const WATCH_PAGE_PATH = '/relogio.html'

export function WatchSetupScreen() {
  const { t } = useT()
  const settings = useSettings()
  const pin = settings?.watchRoomPin
  const autoDim = settings?.watchAutoDim ?? false

  // Só entra em modo "esperando o relógio" quando existe um pin — parado
  // (pin undefined) o hook não abre socket nenhum.
  const { linkOpen, watchConnected } = useWatchRelay({
    pin,
    autoDim,
    score1: '0',
    score2: '0',
    games1: '0',
    games2: '0',
    gamesTarget: '4',
    sets1: '0',
    sets2: '0',
    setsTarget: '1',
    serverTag: '',
    serverSide: null,
    canUndo: false,
    matchOver: false,
    alertText: '',
    onPoint: () => {},
    onUndo: () => {},
    onRepeat: () => {},
  })

  const relayReady = isRelayConfigured()
  const watchUrl = typeof window !== 'undefined' ? `${window.location.origin}${WATCH_PAGE_PATH}` : WATCH_PAGE_PATH

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">{t('Configurar relógio')}</h1>
        <p className="text-sm text-cream/70">
          {t('Marque os pontos direto do pulso — só relógios Samsung/Wear OS por enquanto.')}
        </p>
      </div>

      {!relayReady && (
        <div className={`${card} border border-destructive/50`}>
          <p className="text-sm text-destructive">
            {t(
              'O relay ainda não foi publicado (RELAY_URL continua com o valor de exemplo) — veja relay-worker/RELAY.md pra colocar no ar antes de parear um relógio.',
            )}
          </p>
        </div>
      )}

      <div className={card}>
        {!pin ? (
          <button
            type="button"
            className={primaryButton}
            disabled={!relayReady}
            onClick={() => updateSettings({ watchRoomPin: generatePin() })}
          >
            {t('Gerar código')}
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-cream/60">{t('Código do relógio')}</span>
            <span className="text-5xl font-black tabular-nums tracking-widest text-lime" data-testid="watch-pin">
              {pin}
            </span>
            <p
              className={`text-sm font-semibold ${watchConnected ? 'text-lime' : 'text-cream/60'}`}
              data-testid="watch-connection-status"
            >
              {watchConnected
                ? t('Relógio conectado ✓')
                : linkOpen
                  ? t('Aguardando o relógio…')
                  : t('Conectando ao relay…')}
            </p>
            <button
              type="button"
              className={secondaryButton}
              onClick={() => updateSettings({ watchRoomPin: generatePin() })}
            >
              {t('Gerar novo código')}
            </button>
          </div>
        )}
      </div>

      <div className={card}>
        <p className="mb-2 text-sm text-cream/70">
          {t('No navegador do relógio, abra:')} <span className="font-mono text-cream">{watchUrl}</span>
          {t('e digite o código acima.')}
          <HelpHint
            text={t(
              'Sem Wi-Fi na quadra? Ative o ponto de acesso do tablet/celular e conecte o Wi-Fi do relógio nele (não é o Bluetooth de sempre) — funciona igual.',
            )}
          />
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-cream/80">
          {t('Tela do relógio')}
          <HelpHint
            text={t('Escurecer sozinha economiza bateria; sempre ativa nunca escurece, mas gasta mais.')}
          />
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateSettings({ watchAutoDim: true })}
            className={toggleButton(autoDim)}
          >
            {t('Escurecer sozinha')}
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ watchAutoDim: false })}
            className={toggleButton(!autoDim)}
          >
            {t('Sempre ativa')}
          </button>
        </div>
      </div>

      {pin && (
        <button
          type="button"
          className={secondaryButton}
          onClick={() => updateSettings({ watchRoomPin: undefined })}
        >
          {t('Desparear relógio')}
        </button>
      )}
    </div>
  )
}
