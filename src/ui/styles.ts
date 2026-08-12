export const primaryButton =
  'min-h-11 rounded-lg bg-lime px-4 py-2 font-semibold text-navy disabled:opacity-40 disabled:cursor-not-allowed active:opacity-80'

export const secondaryButton =
  'min-h-11 rounded-lg border border-cream/30 px-4 py-2 font-semibold text-cream active:bg-white/10'

export const destructiveButton =
  'min-h-11 rounded-lg bg-destructive px-4 py-2 font-semibold text-cream active:opacity-80'

export const textInput =
  'min-h-11 flex-1 rounded-lg border border-cream/30 bg-navy px-3 py-2 text-cream placeholder:text-cream/40'

export const bigButton =
  'min-h-16 flex-1 rounded-2xl bg-lime px-4 py-4 text-2xl font-bold text-navy disabled:opacity-30 disabled:cursor-not-allowed active:opacity-80'

/** Same size/weight as bigButton but in cream instead of lime — for a second "team" action that must read as visually distinct from a distance, not just same-color-different-label. */
export const bigButtonAlt =
  'min-h-16 flex-1 rounded-2xl bg-cream px-4 py-4 text-2xl font-bold text-navy disabled:opacity-30 disabled:cursor-not-allowed active:opacity-80'

/**
 * Selection/toggle buttons (format, formação, ordem de saque, tabs...). Uses
 * a lime OUTLINE for the selected state — never a solid lime fill — so it
 * reads as "currently chosen" without competing with primaryButton (solid
 * lime), which must stay the one unambiguous "this submits/acts" color.
 */
export function toggleButton(active: boolean, grow = true): string {
  return `min-h-11 ${grow ? 'flex-1' : ''} rounded-lg px-3 py-2 font-semibold border-2 transition-colors ${
    active ? 'border-lime bg-lime/10 text-lime' : 'border-cream/20 text-cream/70'
  }`
}

export const card = 'rounded-xl bg-navy-light p-4'

export const label = 'flex min-h-11 items-center gap-3 rounded-lg bg-navy-light px-3 py-2'
