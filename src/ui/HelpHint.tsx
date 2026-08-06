import { useState } from 'react'
import { useT } from '../i18n/useT'

/** Small "?" affordance with a one-line explanation (Section 10: context help on setup options). */
export function HelpHint({ text }: { text: string }) {
  const { t } = useT()
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={t('Ajuda')}
        onClick={() => setOpen((o) => !o)}
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full border border-cream/40 text-xs font-bold text-cream/70"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-6 top-0 z-10 w-52 rounded-lg bg-navy-light p-2 text-xs font-normal normal-case text-cream shadow-lg">
          {text}
        </span>
      )}
    </span>
  )
}
